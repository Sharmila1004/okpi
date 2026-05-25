import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import DashboardPage from "../../src/pages/dashboard/DashboardPage";
import { AuthContext } from "../../src/contexts/AuthContext";
import { getUsersSummary } from "../../src/api/authApi";
import { getObjectiveDashboard } from "../../src/api/objectiveApi";
import { getKpis } from "../../src/api/kpiApi";

vi.mock("../../src/api/objectiveApi", () => ({
  getObjectives: vi.fn().mockResolvedValue([]),
  getObjectiveDashboard: vi.fn().mockResolvedValue(defaultDashboard()),
  createObjective: vi.fn(),
  updateObjective: vi.fn(),
  deleteObjective: vi.fn(),
  getObjective: vi.fn(),
  getKeyResults: vi.fn(),
  createKeyResult: vi.fn(),
  updateKeyResult: vi.fn(),
  deleteKeyResult: vi.fn()
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

vi.mock("../../src/api/authApi", () => ({
  getUsersSummary: vi.fn().mockResolvedValue([])
}));

function defaultDashboard() {
  return {
    objectiveCount: 1,
    keyResultCount: 2,
    objectives: [
      {
        id: 1,
        ownerId: 10,
        title: "Grow market share",
        description: "Increase our footprint",
        status: "ON_TRACK",
        progress: 50,
        startDate: "2026-04-01",
        endDate: "2026-05-01",
        assigneeIds: [20, 30],
        keyResultCount: 2,
        lastUpdatedAt: "2026-04-20T10:30:00",
        lastUpdatedByUserId: 20
      }
    ]
  };
}

function managerDashboard() {
  return {
    objectiveCount: 2,
    keyResultCount: 4,
    objectives: [
      {
        id: 1,
        ownerId: 10,
        title: "Grow market share",
        description: "Increase our footprint",
        status: "ON_TRACK",
        progress: 50,
        startDate: "2026-04-01",
        endDate: "2026-05-01",
        assigneeIds: [20, 30],
        keyResultCount: 2,
        lastUpdatedAt: "2026-04-20T10:30:00",
        lastUpdatedByUserId: 20
      },
      {
        id: 2,
        ownerId: 10,
        title: "Improve retention",
        description: "Reduce churn across the team",
        status: "AT_RISK",
        progress: 25,
        startDate: "2026-04-01",
        endDate: "2026-06-01",
        assigneeIds: [30],
        keyResultCount: 2,
        lastUpdatedAt: "2026-04-21T11:00:00",
        lastUpdatedByUserId: 30
      }
    ]
  };
}

function adminDashboard() {
  return {
    objectiveCount: 2,
    keyResultCount: 4,
    objectives: [
      {
        id: 3,
        ownerId: 40,
        title: "Scale operations",
        description: "Coordinate launch readiness",
        status: "ON_TRACK",
        progress: 80,
        startDate: "2026-04-01",
        endDate: "2026-07-01",
        assigneeIds: [50],
        keyResultCount: 1,
        lastUpdatedAt: "2026-04-22T12:00:00",
        lastUpdatedByUserId: 50
      },
      {
        id: 4,
        ownerId: 10,
        title: "Grow market share",
        description: "Increase our footprint",
        status: "ON_TRACK",
        progress: 50,
        startDate: "2026-04-01",
        endDate: "2026-05-01",
        assigneeIds: [20, 30],
        keyResultCount: 2,
        lastUpdatedAt: "2026-04-20T10:30:00",
        lastUpdatedByUserId: 20
      }
    ]
  };
}

function userSummary(id, firstName, lastName, role) {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    role,
    active: true,
    createdAt: "2026-04-28T10:15:30"
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    getObjectiveDashboard.mockReset();
    getKpis.mockReset();
    getUsersSummary.mockReset();

    getObjectiveDashboard.mockResolvedValue(defaultDashboard());
    getKpis.mockResolvedValue([
      {
        id: 1,
        name: "Revenue",
        description: "Monthly recurring revenue",
        currentValue: 80,
        targetValue: 100
      }
    ]);
    getUsersSummary.mockResolvedValue([]);
  });

  it("renders the member dashboard and insight watchlist", async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 20, role: "MEMBER" } }}>
        <DashboardPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("Insight watchlist")).toBeInTheDocument();
    });
    expect(screen.queryByText("Objective momentum")).not.toBeInTheDocument();
  });

  it("expands manager objectives from the manager name", async () => {
    getObjectiveDashboard.mockResolvedValue(managerDashboard());
    getUsersSummary.mockResolvedValue([
      userSummary(10, "Ada", "Manager", "MANAGER"),
      userSummary(20, "Bob", "Builder", "MEMBER"),
      userSummary(30, "Carla", "Contributor", "MEMBER")
    ]);

    render(
      <AuthContext.Provider value={{ user: { id: 10, role: "MANAGER" } }}>
        <DashboardPage />
      </AuthContext.Provider>
    );

    await screen.findByText("Team watchlist");
    const managerButton = await screen.findByRole("button", { name: /Ada Manager/i });
    expect(managerButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(managerButton);
    expect(managerButton).toHaveAttribute("aria-expanded", "true");

    const managerPanel = await screen.findByRole("region", { name: /Ada Manager/i });
    expect(within(managerPanel).getByText("Grow market share")).toBeInTheDocument();
    expect(within(managerPanel).getByText("Improve retention")).toBeInTheDocument();
    expect(
      within(managerPanel).getByText((_, element) =>
        element?.tagName === "SPAN" &&
        element.textContent?.replace(/\s+/g, " ").trim() === "Assigned members: Bob Builder, Carla Contributor"
      )
    ).toBeInTheDocument();
    expect(
      within(managerPanel).getAllByText((_, element) =>
        element?.tagName === "SPAN" &&
        element.textContent?.replace(/\s+/g, " ").includes("Latest update:")
      )
    ).toHaveLength(2);

    expect(getUsersSummary).toHaveBeenCalledWith([10, 20, 30]);
  });

  it("shows admin manager drilldown with real names first", async () => {
    getObjectiveDashboard.mockResolvedValue(adminDashboard());
    getUsersSummary.mockResolvedValue([
      userSummary(10, "Ada", "Manager", "MANAGER"),
      userSummary(20, "Bob", "Builder", "MEMBER"),
      userSummary(30, "Carla", "Contributor", "MEMBER"),
      userSummary(40, "Nina", "Lead", "MANAGER"),
      userSummary(50, "Sam", "Specialist", "MEMBER")
    ]);

    render(
      <AuthContext.Provider value={{ user: { id: 1, role: "ADMIN" } }}>
        <DashboardPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("Managers and teams")).toBeInTheDocument();
    });

    const adaButton = await screen.findByRole("button", { name: /Ada Manager/i });
    const ninaButton = await screen.findByRole("button", { name: /Nina Lead/i });

    expect(adaButton).toBeInTheDocument();
    expect(ninaButton).toBeInTheDocument();

    fireEvent.click(adaButton);
    const adaPanel = await screen.findByRole("region", { name: /Ada Manager/i });
    expect(within(adaPanel).getByText("Grow market share")).toBeInTheDocument();

    fireEvent.click(ninaButton);
    const ninaPanel = await screen.findByRole("region", { name: /Nina Lead/i });
    expect(within(ninaPanel).getByText("Scale operations")).toBeInTheDocument();

    expect(getUsersSummary).toHaveBeenCalledWith([10, 20, 30, 40, 50]);
  });
});
