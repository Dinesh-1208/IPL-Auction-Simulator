import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { roomsTable, messagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getSocketServer } from "../lib/socket";

const router = Router({ mergeParams: true });

// GET /api/rooms/:code/messages
router.get("/", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const { teamId } = req.query;

  let messages;
  if (teamId) {
    messages = await db.select().from(messagesTable)
      .where(and(eq(messagesTable.roomId, room[0].id), eq(messagesTable.teamId, parseInt(teamId as string))))
      .orderBy(desc(messagesTable.createdAt))
      .limit(100);
  } else {
    messages = await db.select().from(messagesTable)
      .where(eq(messagesTable.roomId, room[0].id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(100);
  }

  res.json(messages.reverse().map((m) => ({
    id: m.id,
    roomId: m.roomId,
    teamId: m.teamId,
    userId: m.userId,
    displayName: m.displayName,
    content: m.content,
    isSystem: m.isSystem,
    createdAt: m.createdAt.toISOString(),
  })));
});

// POST /api/rooms/:code/messages
router.post("/", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const { userId, displayName, content, teamId } = req.body;
  if (!userId || !displayName || !content) {
    res.status(400).json({ error: "userId, displayName, and content required" });
    return;
  }

  const [message] = await db.insert(messagesTable).values({
    roomId: room[0].id,
    userId,
    displayName,
    content,
    teamId: teamId ?? null,
    isSystem: false,
  }).returning();

  const io = getSocketServer();
  if (io) {
    io.to(req.params.code).emit("chat:message", {
      id: message.id,
      roomId: message.roomId,
      teamId: message.teamId,
      userId: message.userId,
      displayName: message.displayName,
      content: message.content,
      isSystem: message.isSystem,
      createdAt: message.createdAt.toISOString(),
    });
  }

  res.status(201).json({
    id: message.id,
    roomId: message.roomId,
    teamId: message.teamId,
    userId: message.userId,
    displayName: message.displayName,
    content: message.content,
    isSystem: message.isSystem,
    createdAt: message.createdAt.toISOString(),
  });
});

export default router;
