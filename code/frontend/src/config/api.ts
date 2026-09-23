const rawEnvUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

// Strip trailing slashes and redundant /api suffix for base origin
const cleanedConfiguredUrl = rawEnvUrl
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
const isLocalHost = ["localhost", "127.0.0.1", ""].includes(currentHost);

// Production Render backend deployment
const DEFAULT_RENDER_BACKEND = "https://school-van-backend.onrender.com";

export const API_ORIGIN = (
  cleanedConfiguredUrl ||
  (isLocalHost ? "http://127.0.0.1:5001" : DEFAULT_RENDER_BACKEND)
).replace(/\/+$/, "");

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const API_CONFIG_ERROR = "";

export function ensureApiConfigured() {
  // Always safely resolved with fallback to Render backend
}
