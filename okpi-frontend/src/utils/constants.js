export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_TRACK: "bg-emerald-100 text-emerald-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  OFF_TRACK: "bg-rose-100 text-rose-700",
  BLOCKED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-sky-100 text-sky-700",
  DRAFT: "bg-slate-200 text-slate-700"
};

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/" },
  { label: "Objectives", to: "/objectives" },
  { label: "KPIs", to: "/kpis" }
];
