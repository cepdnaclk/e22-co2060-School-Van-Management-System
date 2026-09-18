import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as driverModel from "../models/driver.model";
import * as vehicleModel from "../models/vehicle.model";
import * as routeModel from "../models/route.model";
import db from "../config/db";

export async function getPredefinedStops(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await db.query("SELECT * FROM predefined_stops ORDER BY name ASC");
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch predefined stops", details: error.message });
  }
}

export async function getOnboardingStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const driver = await driverModel.getDriverByUserId(userId);
    
    if (!driver) {
      return res.json({ completed: false, step: 1 });
    }

    if (!driver.vehicle_id) {
      return res.json({ completed: false, step: 2, driverId: driver.id });
    }

    const routes = await routeModel.getAllRoutes(driver.id);
    if (routes.length === 0) {
      return res.json({ completed: false, step: 3, driverId: driver.id, vehicleId: driver.vehicle_id });
    }

    res.json({ completed: true, driverId: driver.id });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch onboarding status", details: error.message });
  }
}

export async function submitOnboarding(req: AuthenticatedRequest, res: Response) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    console.log(`[Onboarding] Starting submission for user ${req.user!.id}`);
    
    const userId = req.user!.id;
    const { licenseNumber, vehicleDetails, routeStops } = req.body;

    // 1. Create/Update Driver
    let driver = await driverModel.getDriverByUserId(userId, client);
    if (!driver) {
      driver = await driverModel.createDriver({ user_id: userId, license_number: licenseNumber }, client);
    } else {
      driver = await driverModel.updateDriver(driver.id!, { license_number: licenseNumber }, client);
    }
    console.log(`[Onboarding] Driver ${driver.id} ready`);

    // 2. Create/Update Vehicle
    let vehicle = await vehicleModel.getVehicleByNumber(vehicleDetails.registrationNumber, client);
    if (!vehicle) {
      vehicle = await vehicleModel.createVehicle({
        vehicle_number: vehicleDetails.registrationNumber,
        type: vehicleDetails.type,
        capacity: vehicleDetails.seatCount,
        is_ac: vehicleDetails.isAc
      }, client);
      console.log(`[Onboarding] New vehicle ${vehicle.id} created`);
    } else {
      vehicle = await vehicleModel.updateVehicle(vehicle.id!, {
        type: vehicleDetails.type,
        capacity: vehicleDetails.seatCount,
        is_ac: vehicleDetails.isAc
      }, client);
      console.log(`[Onboarding] Existing vehicle ${vehicle.id} updated`);
    }

    // 3. Link Vehicle to Driver
    await driverModel.updateDriver(driver.id!, { vehicle_id: vehicle.id }, client);

    // Query old route stops before deleting them so we can migrate student mappings
    const oldStopsRes = await client.query(
      `SELECT rs.id, rs.stop_name 
       FROM route_stops rs
       JOIN routes r ON rs.route_id = r.id
       WHERE r.driver_id = $1`,
      [driver.id!]
    );
    const oldStops = oldStopsRes.rows;

    // 4. Clear existing routes (to replace with new one)
    await routeModel.deleteRoutesByDriverId(driver.id!, client);
    console.log(`[Onboarding] Existing routes cleared for driver ${driver.id}`);

    // 5. Create Route
    const createdRoute = await routeModel.createRoute({
      route_name: `Standard Daily Route`,
      driver_id: driver.id!,
      vehicle_id: vehicle.id!,
      schedule: "Morning & Afternoon Service",
      stops: routeStops.map((stop: any, index: number) => ({
        stop_name: stop.name,
        stop_order: index + 1,
        latitude: stop.latitude,
        longitude: stop.longitude
      }))
    }, client);
    console.log(`[Onboarding] Route and stops created`);

    // Migrate student stop mappings from old stop IDs to new stop IDs by matching stop names
    if (createdRoute.stops && createdRoute.stops.length > 0 && oldStops.length > 0) {
      for (const oldStop of oldStops) {
        const matchingNewStop = (createdRoute.stops as any[]).find(
          (ns: any) => ns.stop_name.toLowerCase().trim() === oldStop.stop_name.toLowerCase().trim()
        );
        if (matchingNewStop) {
          // Update students table
          await client.query(
            `UPDATE students SET pickup_stop_id = $1 WHERE pickup_stop_id = $2`,
            [matchingNewStop.id, oldStop.id]
          );
          await client.query(
            `UPDATE students SET dropoff_stop_id = $1 WHERE dropoff_stop_id = $2`,
            [matchingNewStop.id, oldStop.id]
          );
          console.log(`[Onboarding] Migrated students from old stop ID ${oldStop.id} to new stop ID ${matchingNewStop.id} (${oldStop.stop_name})`);
        }
      }
    }

    await client.query("COMMIT");
    console.log(`[Onboarding] Success for user ${userId}`);
    res.status(201).json({ message: "Onboarding completed successfully" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(`[Onboarding] ERROR for user ${req.user!.id}:`, error.message);
    res.status(500).json({ error: "Failed to complete onboarding", details: error.message });
  } finally {
    client.release();
  }
}
