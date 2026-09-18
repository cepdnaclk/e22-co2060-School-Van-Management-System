import * as driverModel from "../models/driver.model";
import { Driver } from "../models/driver.model";
import { getActiveJourneyByDriver } from "../models/journeyModel";
import { getParentUserIdsByJourneyId } from "../models/parentModel";
import { saveNotification } from "../models/notificationModel";
import { handleJourneyEventWorkflow } from "./journeyOrchestratorService";
import { emitToUser, emitToRoom, journeyRoom } from "./socketService";

/**
 * Create driver
 */
export const createDriver = async (data: Driver): Promise<Driver> => {
  const { license_number } = data;

  // Basic validation
  if (!license_number) {
    throw new Error("License number is required");
  }

  return await driverModel.createDriver(data);
};

/**
 * Get all drivers
 */
export const getDrivers = async (): Promise<Driver[]> => {
  return await driverModel.getAllDrivers();
};

/**
 * Update driver
 */
export const updateDriver = async (id: number, data: Driver): Promise<Driver> => {
  return await driverModel.updateDriver(id, data);
};

/**
 * Delete driver
 */
export const deleteDriver = async (id: number): Promise<void> => {
  return await driverModel.deleteDriver(id);
};

/**
 * Assign vehicle to driver
 */
export const assignVehicle = async (driverId: number, vehicleId: number): Promise<Driver> => {
  if (!vehicleId) {
    throw new Error("Vehicle ID is required");
  }

  return await driverModel.assignVehicle(driverId, vehicleId);
};

/**
 * Get driver by user ID
 */
export const getDriverByUserId = async (userId: number): Promise<Driver | null> => {
  return await driverModel.getDriverByUserId(userId);
};

/**
 * Trigger SOS emergency alert.
 * Saves a per-parent notification row and emits a real-time socket event
 * directly to every parent whose child is on the active journey.
 */
export const triggerSOS = async (driverId: number): Promise<{ message: string; recipientCount: number }> => {
  const SOS_MESSAGE = "🚨 EMERGENCY: Your driver has triggered an SOS alert! Please check on your child immediately.";

  // 1. Find the active journey for this driver
  const journey = await getActiveJourneyByDriver(driverId);

  let recipientCount = 0;

  if (journey) {
    // 2. Get all parent user IDs for students on this journey
    const parentUserIds = await getParentUserIdsByJourneyId(journey.id);
    recipientCount = parentUserIds.length;

    const timestamp = new Date().toISOString();

    // 3. Save individual notification row per parent + push real-time socket event
    await Promise.all(
      parentUserIds.map(async (parentUserId) => {
        // Persist in DB so it shows up in the parent's notification panel
        await saveNotification({
          journeyId: journey.id,
          userId: parentUserId,
          type: "sos_alert",
          message: SOS_MESSAGE,
        });

        // Push directly to the parent's personal socket room
        emitToUser(parentUserId, "sos:alert", {
          journeyId: journey.id,
          message: SOS_MESSAGE,
          timestamp,
        });
        emitToUser(parentUserId, "sos_alert", {
          journeyId: journey.id,
          message: SOS_MESSAGE,
          timestamp,
        });
      })
    );

    // 4. Also broadcast to the journey room (for any admin / observer)
    emitToRoom(journeyRoom(journey.id), "sos:alert", {
      journeyId: journey.id,
      message: SOS_MESSAGE,
      timestamp,
    });
    emitToRoom(journeyRoom(journey.id), "sos_alert", {
      journeyId: journey.id,
      message: SOS_MESSAGE,
      timestamp,
    });

    // 5. Log as a journey event for the audit trail
    await handleJourneyEventWorkflow(
      journey.id,
      driverId,
      "sos_alert",
      SOS_MESSAGE
    );
  }

  return {
    message: `Emergency alert sent to ${recipientCount} parent(s).`,
    recipientCount,
  };
};

