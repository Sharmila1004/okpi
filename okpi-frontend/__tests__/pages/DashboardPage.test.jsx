import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../../src/pages/dashboard/DashboardPage";

vi.mock("../../src/api/objectiveApi", () => ({
  getObjectives: vi.fn().mockResolvedValue([
    { id: 1, title: "Grow market share", status: "ACTIVE", progress: 50 }
  ])
}));

vi.mock("../../src/api/kpiApi", () => ({
  getKpis: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Revenue",
      description: "Monthly recurring revenue",
      currentValue: 80,
      targetValue: 100
    }
  ])
}));

describe("DashboardPage", () => {
  it("renders dashboard summary cards", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Objective momentum")).toBeInTheDocument();
      expect(screen.getByText("KPI watchlist")).toBeInTheDocument();
    });
  });
});
