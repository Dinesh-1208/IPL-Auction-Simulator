import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "./logger";
import { db } from "@workspace/db";
import { roomsTable, roomMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    path: "/ws/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("join_room", async (data: string | { code: string; userId?: string; displayName?: string }) => {
      let code: string;
      let userId: string | undefined;
      let displayName: string | undefined;

      if (typeof data === "string") {
        code = data;
      } else {
        code = data.code;
        userId = data.userId;
        displayName = data.displayName;
      }

      socket.join(code);
      logger.info({ socketId: socket.id, code, userId }, "Socket joined room");

      // Save roomCode and userId on the socket session
      (socket as any).roomCode = code;
      if (userId) {
        (socket as any).userId = userId;

        try {
          const room = await db.select().from(roomsTable).where(eq(roomsTable.code, code)).limit(1);
          if (room.length) {
            const existing = await db.select().from(roomMembersTable)
              .where(and(eq(roomMembersTable.roomId, room[0].id), eq(roomMembersTable.userId, userId)))
              .limit(1);

            if (existing.length) {
              await db.update(roomMembersTable)
                .set({ isOnline: true })
                .where(eq(roomMembersTable.id, existing[0].id));
            } else if (displayName) {
              await db.insert(roomMembersTable).values({
                roomId: room[0].id,
                userId,
                displayName,
                isOnline: true,
              });
            }

            // Emit to other room members that someone joined / went online
            io?.to(code).emit("room:member_joined", { userId, displayName });
          }
        } catch (err) {
          logger.error(err, "Failed to update member online status in join_room");
        }
      }
    });

    socket.on("leave_room", (code: string) => {
      socket.leave(code);
    });

    socket.on("disconnect", async () => {
      const code = (socket as any).roomCode;
      const userId = (socket as any).userId;
      logger.info({ socketId: socket.id, code, userId }, "Socket disconnected");

      if (code && userId) {
        try {
          const room = await db.select().from(roomsTable).where(eq(roomsTable.code, code)).limit(1);
          if (room.length) {
            const existing = await db.select().from(roomMembersTable)
              .where(and(eq(roomMembersTable.roomId, room[0].id), eq(roomMembersTable.userId, userId)))
              .limit(1);

            if (existing.length) {
              await db.update(roomMembersTable)
                .set({ isOnline: false })
                .where(eq(roomMembersTable.id, existing[0].id));
            }

            // Broadcast that member status changed (offline)
            io?.to(code).emit("room:member_joined", { userId });
          }
        } catch (err) {
          logger.error(err, "Failed to update member offline status in disconnect");
        }
      }
    });
  });

  return io;
}


export function getSocketServer(): SocketIOServer | null {
  return io;
}
