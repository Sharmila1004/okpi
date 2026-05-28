import { ROLES } from "./constants";

export function normalizeRole(role) {
  if (role == null || role === "") {
    return null;
  }

  if (typeof role === "string") {
    const upper = role.toUpperCase();
    if (upper === "ADMIN") {
      return ROLES.ADMIN;
    }
    if (upper === "MANAGER") {
      return ROLES.MANAGER;
    }
    if (upper === "MEMBER") {
      return ROLES.MEMBER;
    }
    return role;
  }

  if (typeof role === "object" && role !== null) {
    if (typeof role.name === "string") {
      return normalizeRole(role.name);
    }
  }

  return String(role);
}

export function humanizeEnum(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getRoleLabel(role) {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case ROLES.ADMIN:
      return "Admin";
    case ROLES.MANAGER:
      return "Manager";
    case ROLES.MEMBER:
      return "Member";
    default:
      return normalized ? humanizeEnum(normalized) : "Unknown";
  }
}

export function isManagerOrAdmin(role) {
  const normalized = normalizeRole(role);
  return normalized === ROLES.ADMIN || normalized === ROLES.MANAGER;
}

export function getInsightLabel(count = 1) {
  return count === 1 ? "Insight" : "Insights";
}

export function getObjectiveLabel(count = 1) {
  return count === 1 ? "Goal" : "Goals";
}

export function formatUserStatus(isActive) {
  return isActive ? "Active" : "Inactive";
}
