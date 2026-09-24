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

import http from "http";
import { Server } from "socket.io";
import WebSocket from "./src/config/webSocket.js";

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
  // Match any Vercel deployment domain
  if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) return true;
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

app.get("/", (req, res) => {
  res.send("Welcome to ChatApp Server");
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
});

WebSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
