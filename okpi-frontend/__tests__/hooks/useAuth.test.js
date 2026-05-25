import { act, renderHook, waitFor } from "@testing-library/react";
import * as authApi from "../../src/api/authApi";
import { AuthProvider } from "../../src/contexts/AuthContext";
import { useAuth } from "../../src/hooks/useAuth";
import { STORAGE_KEYS } from "../../src/utils/constants";

describe("useAuth", () => {
  it("stores session data after login", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6Ik1FTUJFUiJ9.signature",
      refreshToken: "refresh-token"
    });
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue({
      id: 1,
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      role: "MEMBER",
      active: true
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.login({
        email: "user@example.com",
        password: "Password1"
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(window.localStorage.getItem("okpi_access_token")).toBeTruthy();
    });
  });

  it("hydrates the current user from the backend on mount", async () => {
    window.localStorage.setItem(STORAGE_KEYS.accessToken, "access-token");
    window.localStorage.setItem(STORAGE_KEYS.refreshToken, "refresh-token");
    window.localStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify({
        id: 1,
        email: "stale@example.com",
        role: "MEMBER"
      })
    );

    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue({
      id: 1,
      email: "fresh@example.com",
      firstName: "Fresh",
      lastName: "Admin",
      role: "ADMIN",
      active: true
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await waitFor(() => {
      expect(result.current.user?.role).toBe("ADMIN");
      expect(result.current.user?.email).toBe("fresh@example.com");
    });
  });
});
