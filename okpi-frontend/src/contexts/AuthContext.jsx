import { createContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";
import { ROLES, STORAGE_KEYS } from "../utils/constants";
import { normalizeRole } from "../utils/display";
import { getJwtPayload } from "../utils/jwt";

export const AuthContext = createContext(null);

function readStoredAccessToken() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.accessToken);
  } catch {
    return null;
  }
}

function buildUserFromToken(token) {
  const payload = getJwtPayload(token);

  if (!payload) {
    return null;
  }

  const role = normalizeRole(payload.role ?? payload.roles?.[0]) ?? ROLES.MEMBER;

  return {
    id: payload.userId ?? payload.sub ?? null,
    email: payload.email ?? "",
    name: payload.fullName ?? payload.name ?? payload.email ?? "Authenticated User",
    role
  };
}

function buildUserFromResponse(user) {
  if (!user) {
    return null;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const role = normalizeRole(user.role) ?? ROLES.MEMBER;

  return {
    id: user.id ?? null,
    email: user.email ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    name: name || user.email || "Authenticated User",
    role,
    active: user.active ?? true
  };
}

function getStoredUser() {
  const rawUser = window.localStorage.getItem(STORAGE_KEYS.user);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(readStoredAccessToken);
  const [refreshToken, setRefreshToken] = useState(
    window.localStorage.getItem(STORAGE_KEYS.refreshToken)
  );
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  function clearSession() {
    window.localStorage.removeItem(STORAGE_KEYS.accessToken);
    window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
    window.localStorage.removeItem(STORAGE_KEYS.user);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  function persistSession(authResponse) {
    const nextUser =
      buildUserFromResponse(authResponse.user) ??
      buildUserFromToken(authResponse.accessToken) ??
      user;

    window.localStorage.setItem(STORAGE_KEYS.accessToken, authResponse.accessToken);
    if (authResponse.refreshToken) {
      window.localStorage.setItem(STORAGE_KEYS.refreshToken, authResponse.refreshToken);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
    }

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    }

    setAccessToken(authResponse.accessToken);
    setRefreshToken(authResponse.refreshToken ?? null);
    setUser(nextUser);
    return nextUser;
  }

  async function login(credentials) {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      return persistSession(response);
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const response = await authApi.register(payload);
      return persistSession(response);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await authApi.logout(
        refreshToken ?? window.localStorage.getItem(STORAGE_KEYS.refreshToken)
      );
    } catch {
      // Session cleanup is required even if the backend logout request fails.
    } finally {
      clearSession();
    }
  }

  useEffect(() => {
    const token = accessToken ?? readStoredAccessToken();
    if (!token) {
      return;
    }

    let isMounted = true;

    async function hydrateCurrentUser() {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!isMounted || !currentUser) {
          return;
        }

        const nextUser = buildUserFromResponse(currentUser) ?? buildUserFromToken(token);
        if (nextUser) {
          window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
          setUser(nextUser);
        }
      } catch (error) {
        if (error.response?.status === 401 && isMounted) {
          clearSession();
        }
      }
    }

    hydrateCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const isAuthenticated = Boolean(accessToken ?? readStoredAccessToken());

  const value = {
    accessToken,
    refreshToken,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
