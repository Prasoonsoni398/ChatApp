import { io } from "socket.io-client";
import {
  BACKEND_URL,
  DEFAULT_PROD_BACKEND,
  DEFAULT_LOCAL_BACKEND,
} from "./api.js";

// Determine the clean socket server target
const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocalhost = hostname === "localhost";
const isDeployedHost = isBrowser && !isLocalhost;

let socketTarget = BACKEND_URL;
if (isDeployedHost) {
  if (!socketTarget || socketTarget.includes("localhost")) {
    socketTarget = DEFAULT_PROD_BACKEND;
  }
} else {
  // Local development
  if (!socketTarget) {
    socketTarget = DEFAULT_LOCAL_BACKEND;
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
