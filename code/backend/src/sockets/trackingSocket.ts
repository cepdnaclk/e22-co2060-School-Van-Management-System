import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { TRACKING_EVENTS } from "../constants/trackingEvents";
import { JwtUserPayload } from "../types/auth";
import {
  SocketErrorPayload,
  SubscribeJourneyPayload,
  TrackingSubscribedPayload,
} from "../types/tracking";
import { journeyRoom, userRoom } from "../services/socketService";

interface AuthenticatedSocket extends Socket {
  user?: JwtUserPayload;
}

// Temporary until parent-student-journey assignment is implemented
async function canParentViewJourney(
  userId: number,
  journeyId: number
): Promise<boolean> {
  void userId;
  void journeyId;
  return true;
}

function extractToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;

  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const header = socket.handshake.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }

  return null;
}

function emitAuthError(socket: Socket, message: string): void {
  const payload: SocketErrorPayload = { message };
  socket.emit(TRACKING_EVENTS.AUTH_ERROR, payload);
}

function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): void {
  try {
    const token = extractToken(socket);

    if (!token) {
      return next(new Error("Missing authentication token"));
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new Error("JWT_SECRET is not configured"));
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtUserPayload;

    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch {
    return next(new Error("Invalid or expired token"));
  }
}

export function registerTrackingSocket(io: Server): void {
  io.use((socket, next) =>
    authenticateSocket(socket as AuthenticatedSocket, next)
  );

  io.on("connection", (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;

    if (!socket.user) {
      socket.disconnect();
      return;
    }

    socket.join(userRoom(socket.user.id));

    socket.on(
      TRACKING_EVENTS.TRACKING_SUBSCRIBE_JOURNEY,
      async (payload: SubscribeJourneyPayload) => {
        try {
          const { journeyId } = payload ?? {};

          if (!journeyId) {
            return emitAuthError(socket, "journeyId is required");
          }

          if (
            socket.user?.role !== "parent" &&
            socket.user?.role !== "admin"
          ) {
            return emitAuthError(
              socket,
              "Only parents or admins can subscribe to journey tracking"
            );
          }

          if (socket.user.role === "parent") {
            const allowed = await canParentViewJourney(
              socket.user.id,
              journeyId
            );

            if (!allowed) {
              return emitAuthError(socket, "Unauthorized journey subscription");
            }
          }

          const room = journeyRoom(journeyId);

          socket.join(room);

          const response: TrackingSubscribedPayload = {
            journeyId,
            room,
          };

          socket.emit(TRACKING_EVENTS.TRACKING_SUBSCRIBED, response);
        } catch {
          emitAuthError(socket, "Failed to subscribe to journey");
        }
      }
    );

    socket.on(
      TRACKING_EVENTS.TRACKING_UNSUBSCRIBE_JOURNEY,
      (payload: SubscribeJourneyPayload) => {
        const { journeyId } = payload ?? {};

        if (!journeyId) {
          return;
        }

        const room = journeyRoom(journeyId);
        socket.leave(room);

        const response: TrackingSubscribedPayload = {
          journeyId,
          room,
        };

        socket.emit(TRACKING_EVENTS.TRACKING_UNSUBSCRIBED, response);
      }
    );

    socket.on("join-room", (room: string) => {
      socket.join(room);
    });

    socket.on("join_journey", (journeyId: number) => {
      socket.join(journeyRoom(journeyId));
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: socket=${socket.id}, user=${socket.user?.id}, role=${socket.user?.role}`
      );
    });
  });
}