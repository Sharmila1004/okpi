import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createObjective } from "../../src/api/objectiveApi";
import ObjectiveFormPage from "../../src/pages/objectives/ObjectiveFormPage";

vi.mock("../../src/api/objectiveApi", () => ({
  createObjective: vi.fn(),
  getObjective: vi.fn(),
  updateObjective: vi.fn()
}));

describe("ObjectiveFormPage", () => {
  it("submits the objective payload with dates", async () => {
    createObjective.mockResolvedValue({ id: 42 });

    render(
      <MemoryRouter initialEntries={["/objectives/new"]}>
        <Routes>
          <Route path="/objectives/new" element={<ObjectiveFormPage />} />
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
        endDate: "2026-05-17"
      });
    });
  });
});
