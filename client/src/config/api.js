/**
 * api.js
 * Centralized API configuration and base URLs for ChatApp.
 * Handles production vs development URLs and auth headers.
 */

// Production fallback deployed backend on Render
export const DEFAULT_PROD_BACKEND = "https://guftgu-fsrp.onrender.com";

// Local development fallback backend
export const DEFAULT_DEV_BACKEND = "http://localhost:4500";

const getCleanBackendUrl = () => {
  const envDevUrl = (import.meta.env.VITE_DEV_BACKEND_URL || "").trim();
  const envProdUrl = (import.meta.env.VITE_PROD_BACKEND_URL || "").trim();
  const envUrl = (
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).trim();

  const isBrowser = typeof window !== "undefined";
  const isDeployedHost =
    isBrowser &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  // When running on any deployed domain (e.g. Vercel):
  // Ensure we connect to the deployed production backend (never localhost)
  if (isDeployedHost) {
    if (envProdUrl && !envProdUrl.includes("localhost") && !envProdUrl.includes("127.0.0.1")) {
      return envProdUrl;
    }
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    return DEFAULT_PROD_BACKEND;
  }

  // Local development (browser is on localhost / 127.0.0.1):
  if (envDevUrl) {
    return envDevUrl;
  }
  if (envUrl) {
    return envUrl;
  }
  return DEFAULT_DEV_BACKEND;
};

export const BACKEND_URL = getCleanBackendUrl().replace(/\/$/, "");

// API base URL for REST requests (e.g. "https://guftgu-fsrp.onrender.com/api" or "/api")
export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Backend Connection State & Cold-Start Listeners ---
let currentBackendStatus = "idle"; // "idle" | "waking" | "connected" | "error"
let currentStatusDetail = "";
const statusListeners = new Set();

export const getBackendStatus = () => ({
  status: currentBackendStatus,
  detail: currentStatusDetail,
});

export const setBackendStatus = (status, detail = "") => {
  if (currentBackendStatus !== status || currentStatusDetail !== detail) {
    currentBackendStatus = status;
    currentStatusDetail = detail;
    statusListeners.forEach((fn) => {
      try {
        fn({ status, detail });
      } catch (_e) {}
    });
  }
};

export const subscribeBackendStatus = (listener) => {
  statusListeners.add(listener);
  listener({ status: currentBackendStatus, detail: currentStatusDetail });
  return () => statusListeners.delete(listener);
};

/**
 * Intelligent fetch wrapper with cold-start detection and auto-retry.
 * Handles Render free tier 502/503/504 errors and temporary network drops.
 */
export const fetchWithRetry = async (
  url,
  options = {},
  retries = 3,
  backoffMs = 2000,
) => {
  let attempt = 0;
  let slowTimer = null;

  while (attempt <= retries) {
    // If request takes longer than 2.5s, signal that server is booting up
    slowTimer = setTimeout(() => {
      if (currentBackendStatus !== "connected") {
        setBackendStatus(
          "waking",
          "Cloud server is waking up (Render Free Tier, ~30s)...",
        );
      }
    }, 2500);

    try {
      const response = await fetch(url, options);
      clearTimeout(slowTimer);

      // Render cold start typically returns 502 Bad Gateway or 503 while booting Express
      if (
        (response.status === 502 ||
          response.status === 503 ||
          response.status === 504) &&
        attempt < retries
      ) {
        attempt++;
        setBackendStatus(
          "waking",
          `Server container starting up (attempt ${attempt}/${retries})...`,
        );
        await new Promise((r) => setTimeout(r, backoffMs * attempt));
        continue;
      }

      // Success
      if (currentBackendStatus === "waking") {
        setBackendStatus("connected", "Connected to server!");
        setTimeout(() => setBackendStatus("idle"), 3000);
      }
      return response;
    } catch (err) {
      clearTimeout(slowTimer);
      attempt++;
      if (attempt <= retries) {
        setBackendStatus(
          "waking",
          `Connecting to cloud server (attempt ${attempt}/${retries})...`,
        );
        await new Promise((r) => setTimeout(r, backoffMs * attempt));
      } else {
        setBackendStatus("error", "Unable to connect to cloud server.");
        throw err;
      }
    }
  }
};

/**
 * Send a lightweight ping to the Render backend on app start
 * to wake it up in the background if it is sleeping on free tier.
 */
export const wakeUpBackend = async () => {
  try {
    const healthUrl = BACKEND_URL
      ? `${BACKEND_URL}/api/health`
      : "/api/health";
    const res = await fetchWithRetry(healthUrl, { method: "GET", mode: "cors" }, 2, 2000);
    if (res && res.ok) {
      setBackendStatus("connected", "Server is active");
      setTimeout(() => setBackendStatus("idle"), 2500);
    }
  } catch {
    // Ignore ping failure - this is best-effort background wake-up
  }
};

/**
 * Periodically ping /api/health every 10 minutes while user is active
 * to prevent Render from going to sleep during usage.
 */
let keepAliveTimer = null;
export const startKeepAlivePing = () => {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(
    () => {
      wakeUpBackend();
    },
    10 * 60 * 1000,
  ); // 10 minutes
};
