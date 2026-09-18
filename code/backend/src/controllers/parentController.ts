import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as parentModel from "../models/parentModel";
import { emitToRoom, journeyRoom } from "../services/socketService";

export async function getChildren(req: AuthenticatedRequest, res: Response) {
  try {
    const parentId = req.user!.id;
    const children = await parentModel.getChildrenByParentId(parentId);
    
    // Add current status to each child (placeholder for now, could be fetched from journeys)
    const childrenWithStatus = await Promise.all(children.map(async (child) => {
      const boarding = await parentModel.getLatestBoardingForStudent(child.id);
      const dropoff = await parentModel.getLatestDropoffForStudent(child.id);
      
      let status = "at_home";
      if (boarding && (!dropoff || boarding.boarded_at > dropoff.dropped_at)) {
        status = "en_route";
      } else if (dropoff) {
        status = "dropped_off";
      }

      return { ...child, current_status: status };
    }));

    res.json(childrenWithStatus);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch children", details: error.message });
  }
}

export async function registerChild(req: AuthenticatedRequest, res: Response) {
  try {
    const parentId = req.user!.id;
    const { name, school, pickup_stop_id, dropoff_stop_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Child name is required" });
    }

    const child = await parentModel.createChild(parentId, name, school, pickup_stop_id, dropoff_stop_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
    res.status(201).json(child);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to register child", details: error.message });
  }
}

export async function updateChild(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = parseInt(req.params.id as string, 10);
    const { name, school, pickup_stop_id, dropoff_stop_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body;

    // Verify parent owns this child
    const parentId = req.user!.id;
    const children = await parentModel.getChildrenByParentId(parentId);
    if (!children.find(c => c.id === studentId)) {
      return res.status(403).json({ error: "Forbidden: Not your child" });
    }

    const updated = await parentModel.updateChild(studentId, name, school, pickup_stop_id, dropoff_stop_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update child", details: error.message });
  }
}

export async function markAbsent(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = parseInt(req.params.id as string, 10);
    const { date, session_type, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const parentId = req.user!.id;
    const children = await parentModel.getChildrenByParentId(parentId);
    if (!children.find(c => c.id === studentId)) {
      return res.status(403).json({ error: "Forbidden: Not your child" });
    }

    const absence = await parentModel.markChildAbsent(studentId, date, session_type || 'both', reason);

    // Notify driver if child has an active journey
    try {
      const journeyId = await parentModel.getActiveJourneyForStudent(studentId);
      if (journeyId) {
        emitToRoom(journeyRoom(journeyId), "journey:status_change", null);
      }
    } catch (socketErr) {
      console.error("Socket notification failed:", socketErr);
    }

    res.status(201).json(absence);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to mark absent", details: error.message });
  }
}

export async function getAbsences(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = parseInt(req.params.id as string, 10);

    const parentId = req.user!.id;
    const children = await parentModel.getChildrenByParentId(parentId);
    if (!children.find(c => c.id === studentId)) {
      return res.status(403).json({ error: "Forbidden: Not your child" });
    }

    const absences = await parentModel.getChildrenAbsences(studentId);
    res.json(absences);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch absences", details: error.message });
  }
}

export async function cancelAbsence(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = parseInt(req.params.id as string, 10);
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const parentId = req.user!.id;
    const children = await parentModel.getChildrenByParentId(parentId);
    if (!children.find(c => c.id === studentId)) {
      return res.status(403).json({ error: "Forbidden: Not your child" });
    }

    const canceled = await parentModel.deleteChildAbsence(studentId, date as string);

    // Notify driver if child has an active journey
    try {
      const journeyId = await parentModel.getActiveJourneyForStudent(studentId);
      if (journeyId) {
        emitToRoom(journeyRoom(journeyId), "journey:status_change", null);
      }
    } catch (socketErr) {
      console.error("Socket notification failed:", socketErr);
    }

    res.json(canceled);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to cancel absence", details: error.message });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const parentId = req.user!.id;
    const history = await parentModel.getJourneyHistory(parentId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch history", details: error.message });
  }
}

export async function getEmergencyContacts(req: AuthenticatedRequest, res: Response) {
  try {
    const parentId = req.user!.id;
    const contacts = await parentModel.getEmergencyContacts(parentId);
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch emergency contacts", details: error.message });
  }
}

export async function getAvailableRoutes(req: AuthenticatedRequest, res: Response) {
  try {
    const routes = await parentModel.getAvailableRoutes();
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch available routes", details: error.message });
  }
}

export async function getRouteByDriverId(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = parseInt(req.params.driverId as string, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    const route = await parentModel.getRouteByDriverId(driverId);
    if (!route) {
      return res.status(404).json({ error: "No route found for this driver" });
    }

    res.json(route);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch route for driver", details: error.message });
  }
}

export async function getChildStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = parseInt(req.params.id as string, 10);
    const parentId = req.user!.id;

    // Verify ownership
    const children = await parentModel.getChildrenByParentId(parentId);
    if (!children.find(c => c.id === studentId)) {
      return res.status(403).json({ error: "Forbidden: Not your child" });
    }

    const boarding = await parentModel.getLatestBoardingForStudent(studentId);
    const dropoff = await parentModel.getLatestDropoffForStudent(studentId);
    const notifications = await parentModel.getNotificationsByStudentId(studentId);

    let journeyId = null;
    let latestLocation = null;
    let routeStops = [];

    // Prioritize getting journeyId from an active trip for this student's route
    const activeJourneyId = await parentModel.getActiveJourneyForStudent(studentId);
    
    if (activeJourneyId) {
      journeyId = activeJourneyId;
    } else if (boarding && (!dropoff || boarding.boarded_at > dropoff.dropped_at)) {
      journeyId = boarding.journey_id;
    }

    if (journeyId) {
      latestLocation = await parentModel.getLatestLocationByJourneyId(journeyId);
      
      // Fetch Route Stops for this journey
      const journey = await parentModel.getJourneyById(journeyId);
      if (journey) {
        const routes = await parentModel.getAvailableRoutes();
        const routeData = routes.find(r => r.id === journey.route_id);
        routeStops = routeData?.stops || [];
      }
    }

    res.json({
      parentId,
      studentId,
      journeyId,
      boarded: !!(boarding && (!dropoff || boarding.boarded_at > dropoff.dropped_at)),
      dropped: !!(dropoff && (!boarding || dropoff.dropped_at > boarding.boarded_at)),
      latestBoarding: boarding,
      latestDropoff: dropoff,
      latestLocation,
      notifications,
      routeStops
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch child status", details: error.message });
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const parentId = req.user!.id;
    const notifications = await parentModel.getNotificationsByParentId(parentId);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch notifications", details: error.message });
  }
}