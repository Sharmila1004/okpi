function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed) {
    return trimmed.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return "http://localhost:18080";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const STORAGE_KEYS = {
  accessToken: "okpi_access_token",
  refreshToken: "okpi_refresh_token",
  user: "okpi_user"
};

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER"
};

export const OBJECTIVE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "ON_TRACK", label: "On track" },
  { value: "AT_RISK", label: "At risk" },
  { value: "OFF_TRACK", label: "Off track" },
  { value: "COMPLETED", label: "Completed" }
];

export const STATUS_COLORS = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ON_TRACK: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  AT_RISK: "bg-amber-50 text-amber-700 ring-amber-200",
  OFF_TRACK: "bg-rose-50 text-rose-700 ring-rose-200",
  BLOCKED: "bg-rose-50 text-rose-700 ring-rose-200",
  COMPLETED: "bg-sky-50 text-sky-700 ring-sky-200",
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-200"
};

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/" },
  { label: "Goals", to: "/objectives" },
  { label: "Insights", to: "/insights" }
];
