// Dynamically resolve API base URL:
// - In browser: use the current origin (routed through nginx reverse proxy)
// - During SSR/build: fallback to env variable or localhost
const getApiBaseUrl = (): string => {
  // Prefer explicit env var (works in both browser and SSR)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // In browser behind nginx reverse proxy, use same origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();
