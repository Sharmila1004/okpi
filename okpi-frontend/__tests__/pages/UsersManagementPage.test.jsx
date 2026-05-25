import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "../../src/contexts/AuthContext";
import UsersManagementPage from "../../src/pages/admin/UsersManagementPage";
import {
  changeUserRole,
  deleteUser,
  getUsers,
  updateUserByAdmin
} from "../../src/api/authApi";

vi.mock("../../src/api/authApi", () => ({
  changeUserRole: vi.fn(),
  deleteUser: vi.fn(),
  getUsers: vi.fn(),
  updateUserByAdmin: vi.fn()
}));

describe("UsersManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUsers.mockResolvedValue(usersPage());
    changeUserRole.mockResolvedValue({});
    deleteUser.mockResolvedValue({});
    updateUserByAdmin.mockResolvedValue({
      id: 7,
      email: "alicia@example.com",
      firstName: "Alicia",
      lastName: "Adams",
      role: "ADMIN",
      active: true,
      createdAt: "2026-04-28T10:15:30"
    });
  });

  it("lets an admin edit user details from the list", async () => {
    const user = userEvent.setup();
    const setUser = vi.fn();

    render(
      <AuthContext.Provider
        value={{
          user: {
            id: 1,
            email: "admin@example.com",
            firstName: "Admin",
            lastName: "User",
            role: "ADMIN",
            active: true
          },
          setUser
        }}
      >
        <UsersManagementPage />
      </AuthContext.Provider>
    );

    await screen.findByText("alice@example.com");

    await user.click(screen.getByRole("button", { name: /edit details/i }));

    await user.clear(screen.getByRole("textbox", { name: /first name/i }));
    await user.type(screen.getByRole("textbox", { name: /first name/i }), "Alicia");
    await user.clear(screen.getByRole("textbox", { name: /last name/i }));
    await user.type(screen.getByRole("textbox", { name: /last name/i }), "Adams");
    await user.clear(screen.getByRole("textbox", { name: /email/i }));
    await user.type(screen.getByRole("textbox", { name: /email/i }), "alicia@example.com");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateUserByAdmin).toHaveBeenCalledWith(7, {
        firstName: "Alicia",
        lastName: "Adams",
        email: "alicia@example.com"
      });
    });

    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(setUser).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText("Edit user details")).not.toBeInTheDocument();
    });
  });

  it("lets an admin delete a user from the list", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <AuthContext.Provider
        value={{
          user: {
            id: 1,
            email: "admin@example.com",
            firstName: "Admin",
            lastName: "User",
            role: "ADMIN",
            active: true
          },
          setUser: vi.fn(),
          logout: vi.fn()
        }}
      >
        <UsersManagementPage />
      </AuthContext.Provider>
    );

    await screen.findByText("alice@example.com");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith(7);
    });

    expect(getUsers).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });
});

function usersPage() {
  return {
    content: [
      {
        id: 7,
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Anderson",
        role: "ADMIN",
        active: true,
        createdAt: "2026-04-28T10:15:30"
      }
    ],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    last: true
  };
}
