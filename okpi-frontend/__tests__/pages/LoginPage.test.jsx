import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../src/contexts/AuthContext";
import LoginPage from "../../src/pages/auth/LoginPage";

describe("LoginPage", () => {
  it("submits credentials through auth context", async () => {
    const login = vi.fn().mockResolvedValue({});

    render(
      <AuthContext.Provider value={{ login, loading: false }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { name: "email", value: "user@example.com" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { name: "password", value: "Password1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password1"
      })
    );
  });
});
