const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL
  ?.trim()
  .replace(/\/+$/, "");

// Vercel injects VITE_* values while building the frontend. The API must be
// hosted separately and supplied as an HTTPS URL in VITE_BACKEND_URL.
// Only local development may fall back to localhost.
export const BACKEND_URL = configuredBackendUrl ?? (
  import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:3020`
    : ""
);
