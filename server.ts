import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const connectedUsers: Record<string, string> = {};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: { origin: "*" },
  });

  // JWT 인증 미들웨어
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const user = jwt.verify(token, process.env.NEXTAUTH_SECRET as string);
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const username: string =
      socket.data.user?.name || socket.data.user?.username || "익명";
    connectedUsers[socket.id] = username;

    console.log(`[Socket] User connected: ${username}`);
    io.emit("update users", Object.values(connectedUsers));

    socket.on("chat message", (msg: string) => {
      io.emit("chat message", { username, msg });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${username}`);
      delete connectedUsers[socket.id];
      io.emit("update users", Object.values(connectedUsers));
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
