import { describe, expect, it, vi } from "vitest";
import axiosInstance from "../../src/api/axiosInstance";
import { getObjectives } from "../../src/api/objectiveApi";

vi.mock("../../src/api/axiosInstance", () => ({
  default: {
    get: vi.fn()
  }
}));

describe("objectiveApi", () => {
  it("unwraps paged objective responses", async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            title: "Improve onboarding",
            progressPercentage: 75
          }
        ]
      }
    });

    const objectives = await getObjectives();

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/objectives?page=0&size=1000");
    expect(objectives).toEqual([
      {
        id: 1,
        title: "Improve onboarding",
        progressPercentage: 75,
        progress: 75
      }
    ]);
  });
});
