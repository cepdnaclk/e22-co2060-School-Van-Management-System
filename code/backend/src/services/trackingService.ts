import { emitToRoom, journeyRoom } from "./socketService";
import { TRACKING_EVENTS } from "../constants/trackingEvents";
import { saveLocation } from "../models/locationModel";

interface LocationPayload {
  driverId: number;
  journeyId: number;
  lat: number;
  lng: number;
}

export async function processLocationUpdate(
  payload: LocationPayload
): Promise<void> {
  const timestamp = new Date().toISOString();

  await saveLocation({
    ...payload,
    timestamp,
  });

  emitToRoom(
    journeyRoom(payload.journeyId),
    TRACKING_EVENTS.TRACKING_LOCATION_BROADCAST,
    {
      journeyId: payload.journeyId,
      lat: payload.lat,
      lng: payload.lng,
      timestamp,
    }
  );
  emitToRoom(
    journeyRoom(payload.journeyId),
    "location_broadcast",
    {
      journeyId: payload.journeyId,
      lat: payload.lat,
      lng: payload.lng,
      timestamp,
    }
  );
  emitToRoom(
    journeyRoom(payload.journeyId),
    "location_update",
    {
      lat: payload.lat,
      lng: payload.lng,
      timestamp,
    }
  );
}