import { createContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";
import { ROLES, STORAGE_KEYS } from "../utils/constants";

export const AuthContext = createContext(null);

function parseJwt(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

function buildUserFromToken(token) {
  const payload = parseJwt(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.userId ?? payload.sub ?? null,
    email: payload.email ?? payload.sub ?? "",
    name: payload.fullName ?? payload.name ?? "Authenticated User",
    role: payload.role ?? payload.roles?.[0] ?? ROLES.MEMBER
  };
}

function getStoredUser() {
  const rawUser = window.localStorage.getItem(STORAGE_KEYS.user);
  return rawUser ? JSON.parse(rawUser) : null;
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    window.localStorage.getItem(STORAGE_KEYS.accessToken)
  );
  const [refreshToken, setRefreshToken] = useState(
    window.localStorage.getItem(STORAGE_KEYS.refreshToken)
  );
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  function persistSession(authResponse) {
    const nextUser = buildUserFromToken(authResponse.accessToken) ?? user;

    window.localStorage.setItem(STORAGE_KEYS.accessToken, authResponse.accessToken);
    window.localStorage.setItem(
      STORAGE_KEYS.refreshToken,
      authResponse.refreshToken ?? ""
    );

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    }

    setAccessToken(authResponse.accessToken);
    setRefreshToken(authResponse.refreshToken);
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
      await authApi.logout(user?.id);
    } catch {
      // Session cleanup is required even if the backend logout request fails.
    } finally {
      window.localStorage.removeItem(STORAGE_KEYS.accessToken);
      window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
      window.localStorage.removeItem(STORAGE_KEYS.user);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  }

  useEffect(() => {
    if (!accessToken || user) {
      return;
    }

    const nextUser = buildUserFromToken(accessToken);
    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, [accessToken, user]);

  const value = {
    accessToken,
    refreshToken,
    user,
    loading,
    isAuthenticated: Boolean(accessToken),
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
