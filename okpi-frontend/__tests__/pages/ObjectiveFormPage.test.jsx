import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getUsers } from "../../src/api/authApi";
import { createObjective } from "../../src/api/objectiveApi";
import ObjectiveFormPage from "../../src/pages/objectives/ObjectiveFormPage";

vi.mock("../../src/api/objectiveApi", () => ({
  createObjective: vi.fn(),
  getObjective: vi.fn(),
  updateObjective: vi.fn()
}));

vi.mock("../../src/api/authApi", () => ({
  getUsers: vi.fn().mockResolvedValue({ content: [] })
}));

describe("ObjectiveFormPage", () => {
  it("submits the objective payload with dates", async () => {
    createObjective.mockResolvedValue({ id: 42 });

    render(
      <MemoryRouter initialEntries={["/objectives/new"]}>
        <Routes>
          <Route path="/objectives/new" element={<ObjectiveFormPage />} />
          <Route path="/objectives/:objectiveId" element={<div>Objective detail</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { name: "title", value: "Improve onboarding" }
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { name: "description", value: "Reduce drop-off in the first week" }
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { name: "startDate", value: "2026-04-17" }
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { name: "endDate", value: "2026-05-17" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save objective" }));

    await waitFor(() => {
      expect(createObjective).toHaveBeenCalledWith({
        title: "Improve onboarding",
        description: "Reduce drop-off in the first week",
        startDate: "2026-04-17",
        endDate: "2026-05-17",
        assigneeIds: []
      });
    });
  });

  it("shows the selected assignees before saving", async () => {
    createObjective.mockResolvedValue({ id: 42 });
    const users = [
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
    ];

    getUsers.mockResolvedValue({ content: users });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/objectives/new"]}>
        <Routes>
          <Route path="/objectives/new" element={<ObjectiveFormPage />} />
          <Route path="/objectives/:objectiveId" element={<div>Objective detail</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("alice@example.com");
    const checkboxes = await screen.findAllByRole("checkbox");

    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
    expect(await screen.findByText(/Assigned to: Alice Anderson, Bob Builder/)).toBeInTheDocument();
  });
});
