import { io } from "socket.io-client";
import {
  BACKEND_URL,
  DEFAULT_PROD_BACKEND,
  DEFAULT_LOCAL_BACKEND,
  DEFAULT_LOCAL_IP_BACKEND,
} from "./api.js";

// Determine the clean socket server target
const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocalhost =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "0.0.0.0" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.");
const isDeployedHost = isBrowser && !isLocalhost;

let socketTarget = BACKEND_URL;
if (isDeployedHost) {
  if (
    !socketTarget ||
    socketTarget.includes("localhost") ||
    socketTarget.includes("127.0.0.1")
  ) {
    socketTarget = DEFAULT_PROD_BACKEND;
  }
} else {
  // Local development
  if (!socketTarget) {
    socketTarget =
      hostname === "127.0.0.1"
        ? DEFAULT_LOCAL_IP_BACKEND
        : DEFAULT_LOCAL_BACKEND;
  }
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
