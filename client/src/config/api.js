/**
 * api.js
 * Centralized API configuration and base URLs for ChatApp.
 * Handles production vs development URLs and auth headers.
 */

// Production fallback deployed backend on Render
export const DEFAULT_PROD_BACKEND = "https://guftgu-fsrp.onrender.com";

const getCleanBackendUrl = () => {
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

  // In production builds or when running on any live deployed domain:
  // Never allow localhost / 127.0.0.1 because live users cannot connect to localhost!
  if (import.meta.env.PROD || isDeployedHost) {
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      return DEFAULT_PROD_BACKEND;
    }
    return envUrl;
  }

  // Local development
  return envUrl;
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

/**
 * Send a lightweight ping to the Render backend on app start
 * to wake it up in the background if it is sleeping on free tier.
 */
export const wakeUpBackend = async () => {
  try {
    const healthUrl = BACKEND_URL
      ? `${BACKEND_URL}/api/health`
      : "/api/health";
    await fetch(healthUrl, { method: "GET", mode: "cors" });
  } catch {
    // Ignore ping failure - this is best-effort background wake-up
  }
};
