import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserIdFromToken } from "./lib/auth";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  path: "/api/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Attach io to app for use in route handlers
(app as typeof app & { io: SocketIOServer }).io = io;

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    next(new Error("Authentication error"));
    return;
  }
  const userId = getUserIdFromToken(token);
  if (!userId) {
    next(new Error("Invalid token"));
    return;
  }
  (socket as typeof socket & { userId: number }).userId = userId;
  next();
});

io.on("connection", async (socket) => {
  const userId = (socket as typeof socket & { userId: number }).userId;
  logger.info({ userId, socketId: socket.id }, "User connected");

  // Mark user online
  try {
    await db
      .update(usersTable)
      .set({ isOnline: true })
      .where(eq(usersTable.id, userId));
    io.emit("user_online", { userId });
  } catch (err) {
    logger.error({ err }, "Failed to update online status");
  }

  socket.on("join_conversation", (conversationId: number) => {
    socket.join(`conversation:${conversationId}`);
    logger.info({ userId, conversationId }, "User joined conversation");
  });

  socket.on("leave_conversation", (conversationId: number) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("typing_start", ({ conversationId }: { conversationId: number }) => {
    socket.to(`conversation:${conversationId}`).emit("typing_start", { userId, conversationId });
  });

  socket.on("typing_stop", ({ conversationId }: { conversationId: number }) => {
    socket.to(`conversation:${conversationId}`).emit("typing_stop", { userId, conversationId });
  });

  socket.on("disconnect", async () => {
    logger.info({ userId, socketId: socket.id }, "User disconnected");
    try {
      await db
        .update(usersTable)
        .set({ isOnline: false, lastSeen: new Date() })
        .where(eq(usersTable.id, userId));
      io.emit("user_offline", { userId });
    } catch (err) {
      logger.error({ err }, "Failed to update offline status");
    }
  });
});

// Make io accessible in routes via request
app.use((req, _res, next) => {
  (req as typeof req & { io: SocketIOServer }).io = io;
  next();
});

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
