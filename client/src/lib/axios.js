import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 60000, // analysis (OCR + Gemini) can take a while
});

// Attach JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Friendly fallbacks keyed by HTTP status when the server gives no JSON body.
const STATUS_MESSAGES = {
  400: "Invalid request. Please check the details and try again.",
  401: "Your session has expired or you're not signed in. Please log in again.",
  403: "You don't have permission to do that.",
  404: "The requested resource was not found.",
  409: "That already exists.",
  413: "The file is too large. Please upload a smaller resume (max 10 MB).",
  429: "Too many requests or AI quota exceeded. Please wait a moment and try again.",
  500: "The server hit an unexpected error. Please try again, and check the server logs for details.",
  502: "The AI service could not be reached. Please try again shortly.",
  503: "A required service isn't configured on the server (check GEMINI_API_KEY / database).",
};

/**
 * Turn any axios error into a single, human-readable message.
 * Handles: no server (network), timeout, JSON error bodies, HTML/text bodies,
 * and status-only fallbacks.
 */
function buildMessage(error) {
  // 1. Request was made but no response received (server down, CORS, DNS, proxy fail).
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "The request timed out. The server may be busy or the analysis took too long. Please try again.";
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Make sure the backend is running on http://localhost:5000 and try again.";
    }
    return error.message || "Cannot reach the server. Please check your connection and try again.";
  }

  const { status, data } = error.response;

  // 2. Server returned a structured JSON error (our API does this).
  if (data && typeof data === "object") {
    const base = data.error || data.message;
    if (base) {
      // Include extra detail in development if present.
      return data.detail && data.detail !== base ? `${base} (${data.detail})` : base;
    }
  }

  // 3. Server returned a non-JSON body (e.g. HTML error page / proxy 500).
  //    Don't dump raw HTML at the user; map the status to something useful.
  if (STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  // 4. Last resort.
  return `Request failed (HTTP ${status}). Please try again.`;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const friendly = buildMessage(error);
    const err = new Error(friendly);
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export default api;
