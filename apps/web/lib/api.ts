// Dynamically resolve API base URL:
// - In browser: use the current origin (routed through nginx reverse proxy)
// - During SSR/build: fallback to env variable or localhost
const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();
