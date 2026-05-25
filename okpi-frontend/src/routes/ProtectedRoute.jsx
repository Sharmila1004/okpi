import { Navigate, Outlet, useLocation } from "react-router-dom";
import { STORAGE_KEYS } from "../utils/constants";
import { normalizeRole } from "../utils/display";
import { getJwtPayload } from "../utils/jwt";
import { useAuth } from "../hooks/useAuth";

function readStoredAccessToken() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.accessToken);
  } catch {
    return null;
  }
}

function roleFromAccessToken(token) {
  const payload = getJwtPayload(token);
  if (!payload) {
    return null;
  }
  return normalizeRole(payload.role ?? payload.roles?.[0]);
}

export default function ProtectedRoute({ roles }) {
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const token = accessToken ?? readStoredAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const effectiveRole = normalizeRole(user?.role) ?? roleFromAccessToken(token);

  if (roles?.length && (!effectiveRole || !roles.includes(effectiveRole))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
