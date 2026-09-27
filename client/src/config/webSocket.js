import { io } from "socket.io-client";

// Use the env variable. Falls back to deployed backend if not set.
// In production builds VITE_BACKEND_URL must be set to the deployed API URL.
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://guftgu-fsrp.onrender.com";

const socketAPI = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socketAPI;
