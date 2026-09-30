import { io } from "socket.io-client";
import { BACKEND_URL, DEFAULT_PROD_BACKEND, DEFAULT_DEV_BACKEND } from "./api.js";

// Determine the clean socket server target
const isBrowser = typeof window !== "undefined";
const isDeployedHost =
  isBrowser &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

let socketTarget = BACKEND_URL;
if (isDeployedHost && (!socketTarget || socketTarget.includes("localhost") || socketTarget.includes("127.0.0.1"))) {
  socketTarget = DEFAULT_PROD_BACKEND;
} else if (!socketTarget) {
  socketTarget = DEFAULT_DEV_BACKEND;
}

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

socketAPI.on("connect", () => {
  console.log("🟢 [WebSocket] Connected successfully to:", socketTarget, "ID:", socketAPI.id);
});

socketAPI.on("connect_error", (err) => {
  console.warn("🟡 [WebSocket] Connection attempt notice:", err.message);
});

export default socketAPI;
