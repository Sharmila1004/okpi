import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../src/contexts/AuthContext";
import ProtectedRoute from "../../src/routes/ProtectedRoute";

function renderWithAuth(authValue, initialEntries = ["/"]) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    renderWithAuth({ isAuthenticated: false, user: null });
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    renderWithAuth({ isAuthenticated: true, user: { role: "MEMBER" } });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
