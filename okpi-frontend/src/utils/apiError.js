import { API_BASE_URL } from "./constants";

function joinFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return "";
  }

  return Object.entries(fieldErrors)
    .map(([key, value]) => (value ? `${key}: ${value}` : ""))
    .filter(Boolean)
    .join(" ");
}

export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  if (!error?.response) {
    const code = error?.code;
    const msg = error?.message ?? "";
    if (code === "ERR_NETWORK" || msg === "Network Error") {
      const where = API_BASE_URL?.trim()
        ? API_BASE_URL
        : "the dev server (Vite proxies /api to http://127.0.0.1:18080)";
      return `Cannot reach the API (${where}). Start the API gateway on port 18080, or set VITE_PROXY_TARGET in .env if the gateway runs elsewhere. For a hosted build, set VITE_API_BASE_URL. If you still call the gateway directly from a LAN URL, its CORS rules must allow your page origin.`;
    }
    if (code === "ECONNABORTED") {
      return "Request timed out. Try again.";
    }

    // During local development include extra debug info to help troubleshooting
    if (import.meta.env.DEV) {
      try {
        return `${msg} ${JSON.stringify({ code, stack: error?.stack ?? null })}`;
      } catch (e) {
        return msg || fallback;
      }
    }

    return msg || fallback;
  }

  const status = error.response?.status;
  const data = error?.response?.data;

  // In dev show full status + body for easier debugging
  if (import.meta.env.DEV) {
    let body;
    try {
      body = typeof data === "object" ? JSON.stringify(data) : String(data);
    } catch (e) {
      body = String(data);
    }
    return `API ${status ?? ""} - ${body ?? fallback}`;
  }

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.message && typeof data.message === "string") {
    const joined = joinFieldErrors(data.fieldErrors);
    if (joined) {
      return `${data.message} - ${joined}`;
    }
    return data.message;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  const joined = joinFieldErrors(data.fieldErrors);
  if (joined) {
    return joined;
  }

  return fallback;
}
