// Dynamically resolve API base URL:
// - In browser: use the current hostname (works on localhost AND deployed servers)
// - During SSR/build: fallback to env variable or localhost
const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();
