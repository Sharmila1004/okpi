import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "../../api/authApi";
import ProfilePage from "./ProfilePage";

const setUser = vi.fn();

vi.mock("../../api/authApi", () => ({
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn()
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "MANAGER" },
    setUser
  })
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    authApi.getCurrentUser.mockResolvedValue({
      firstName: "Alice",
      lastName: "Anderson",
      email: "alice@example.com"
    });
  });

  it("keeps manager profile details read only", async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("Alice")).toBeDisabled();
    expect(screen.getByDisplayValue("Anderson")).toBeDisabled();
    expect(screen.getByDisplayValue("alice@example.com")).toBeDisabled();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(
      screen.getByText(/only admins can edit profile details/i)
    ).toBeInTheDocument();
    expect(authApi.updateCurrentUser).not.toHaveBeenCalled();
  });
});
