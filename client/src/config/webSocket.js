import { io } from "socket.io-client";

// Use the env variable. In dev it points to http://localhost:4500.
// In production builds it should be set to the deployed API URL.
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4500";

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
