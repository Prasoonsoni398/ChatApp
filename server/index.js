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
import { scheduleMediaCleanup } from "./src/utils/mediaCleanup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

const envOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const staticOrigins = [
  ...envOrigins,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "https://chat-app-two-rosy-94.vercel.app",
];

const isAllowedOrigin = (origin) => {
  // Allow requests without Origin (same-origin, curl, server-to-server, mobile native)
  if (!origin) return true;
  // If CLIENT_URL is set to "*", allow all origins
  if (process.env.CLIENT_URL === "*") return true;

  const cleanOrigin = origin.replace(/\/$/, "");
  if (staticOrigins.includes(cleanOrigin)) return true;

  // Match localhost or 127.0.0.1 on any port
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;

  // Match any Vercel, Render, Netlify, or Cloudflare Pages deployment domain
  if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.onrender\.com$/.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.netlify\.app$/.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.pages\.dev$/.test(cleanOrigin)) return true;

  // In production or if CLIENT_URL not strictly set, allow all browser origins
  return true;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      // Return null, false to reject origin without crashing Express
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health Check Endpoint (useful for Render keep-alive pings and uptime monitors)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "ChatApp Server API is active",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

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
app.use((req, res, next) => {
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

// Express Global Error Handler (guarantees CORS headers and JSON format on any unhandled error)
app.use((err, req, res, next) => {
  console.error("[ServerError]:", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
});

app.set("io", io);

WebSocket(io);

// Start the 48-hour media expiry cron job
scheduleMediaCleanup();

// Listen on 0.0.0.0 for external container routing on Render/Docker/Railway
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
