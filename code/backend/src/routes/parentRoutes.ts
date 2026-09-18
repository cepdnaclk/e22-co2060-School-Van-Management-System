import { Router } from "express";
import * as parentController from "../controllers/parentController";
import { startMockJourney } from "../controllers/mockController";

const router = Router();

router.get("/children", parentController.getChildren);
router.post("/children", parentController.registerChild);
router.put("/children/:id", parentController.updateChild);
router.post("/children/:id/absent", parentController.markAbsent);
router.get("/children/:id/absences", parentController.getAbsences);
router.delete("/children/:id/absences/:date", parentController.cancelAbsence);
router.get("/journey-history", parentController.getHistory);
router.get("/emergency-contacts", parentController.getEmergencyContacts);
router.get("/children/:id/status", parentController.getChildStatus);
router.post("/children/:id/mock-journey", startMockJourney);
router.get("/available-routes", parentController.getAvailableRoutes);
router.get("/route-by-driver/:driverId", parentController.getRouteByDriverId);
router.get("/notifications", parentController.getNotifications);

export default router;
