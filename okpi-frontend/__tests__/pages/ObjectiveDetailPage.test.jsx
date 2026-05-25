import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../src/contexts/AuthContext";
import ObjectiveDetailPage from "../../src/pages/objectives/ObjectiveDetailPage";
import { getUsersSummary } from "../../src/api/authApi";
import { getKeyResults, getObjective } from "../../src/api/objectiveApi";

vi.mock("../../src/api/objectiveApi", () => ({
  createKeyResult: vi.fn(),
  deleteKeyResult: vi.fn(),
  deleteObjective: vi.fn(),
  getKeyResults: vi.fn(),
  getObjective: vi.fn(),
  updateKeyResult: vi.fn()
}));

vi.mock("../../src/api/authApi", () => ({
  getUsersSummary: vi.fn()
}));

describe("ObjectiveDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getObjective.mockResolvedValue({
      id: 42,
      ownerId: 99,
      title: "Improve onboarding",
      description: "Reduce drop-off in the first week",
      status: "ON_TRACK",
      startDate: "2026-04-17",
      endDate: "2026-05-17",
      progressPercentage: 50,
      assigneeIds: [11, 12]
    });

    getKeyResults.mockResolvedValue([]);
    getUsersSummary.mockResolvedValue([
      {
        id: 11,
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Anderson",
        role: "MEMBER",
        active: true,
        createdAt: "2026-04-28T10:15:30"
      },
      {
        id: 12,
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Builder",
        role: "MEMBER",
        active: true,
        createdAt: "2026-04-28T10:15:30"
      }
    ]);
  });

  it("shows assigned users by name", async () => {
    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, role: "ADMIN" },
          accessToken: "token"
        }}
      >
        <MemoryRouter initialEntries={["/objectives/42"]}>
          <Routes>
            <Route path="/objectives/:objectiveId" element={<ObjectiveDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/Assigned to: Alice Anderson, Bob Builder/)).toBeInTheDocument();
    expect(getUsersSummary).toHaveBeenCalledWith([11, 12]);
  });
});
