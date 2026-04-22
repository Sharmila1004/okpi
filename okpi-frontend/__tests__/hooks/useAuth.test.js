import { act, renderHook, waitFor } from "@testing-library/react";
import * as authApi from "../../src/api/authApi";
import { AuthProvider } from "../../src/contexts/AuthContext";
import { useAuth } from "../../src/hooks/useAuth";

describe("useAuth", () => {
  it("stores session data after login", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      accessToken:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6Ik1FTUJFUiJ9.signature",
      refreshToken: "refresh-token"
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
});
