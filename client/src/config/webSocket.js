import { io } from "socket.io-client";
import { BACKEND_URL, DEFAULT_PROD_BACKEND } from "./api.js";

// In production, fallback to deployed Render backend URL.
// In dev, use BACKEND_URL if set, or current origin / localhost:5000.
const socketTarget = BACKEND_URL || DEFAULT_PROD_BACKEND;

const socketAPI = io(socketTarget, {
  transports: ["polling", "websocket"],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socketAPI;

