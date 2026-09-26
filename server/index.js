import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRouter from "./src/routers/auth.router.js";
import userRouter from "./src/routers/user.router.js";
import messageRouter from "./src/routers/message.router.js";
import groupRouter from "./src/routers/group.router.js";
import statusRouter from "./src/routers/status.router.js";
import communityRouter from "./src/routers/community.router.js";
import channelRouter from "./src/routers/channel.router.js";
import reportRouter from "./src/routers/report.router.js";
import contactRouter from "./src/routers/contact.router.js";

import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import WebSocket from "./src/config/webSocket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

const staticOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://chat-app-two-rosy-94.vercel.app",
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, ""));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, "");
  if (staticOrigins.includes(cleanOrigin)) return true;
  // Match any Vercel or Render deployment domain
  if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.onrender\.com$/.test(cleanOrigin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);
app.use("/api/status", statusRouter);
app.use("/api/communities", communityRouter);
app.use("/api/channels", channelRouter);
app.use("/api/reports", reportRouter);
app.use("/api/contacts", contactRouter);

// Serve frontend static build if available (supports single fullstack deployment on Render)
const clientDistPath = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// Fallback for SPA client routing (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }
  const indexPath = path.join(clientDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send("Welcome to ChatApp Server (API is running)");
    }
  });
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
});

app.set("io", io);

WebSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
