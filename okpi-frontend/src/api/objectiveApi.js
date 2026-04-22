import axiosInstance from "./axiosInstance";

function normalizeObjective(objective) {
  return {
    ...objective,
    progress: objective.progressPercentage ?? objective.progress ?? 0
  };
}

export async function getObjectives(params = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 1000));

  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.ownerId !== undefined && params.ownerId !== null) {
    searchParams.set("ownerId", String(params.ownerId));
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const response = await axiosInstance.get(`/api/v1/objectives?${searchParams}`);
  const objectives = Array.isArray(response.data)
    ? response.data
    : response.data?.content ?? [];

  return objectives.map(normalizeObjective);
}

export async function getObjective(objectiveId) {
  const response = await axiosInstance.get(`/api/v1/objectives/${objectiveId}`);
  const objective = response.data.objective ?? response.data;
  return normalizeObjective(objective);
}

export async function createObjective(payload) {
  const response = await axiosInstance.post("/api/v1/objectives", payload);
  return response.data;
}

export async function updateObjective(objectiveId, payload) {
  const response = await axiosInstance.put(
    `/api/v1/objectives/${objectiveId}`,
    payload
  );
  return response.data;
}

export async function deleteObjective(objectiveId) {
  const response = await axiosInstance.delete(`/api/v1/objectives/${objectiveId}`);
  return response.data;
}

export async function getKeyResults(objectiveId) {
  const response = await axiosInstance.get(
    `/api/v1/objectives/${objectiveId}/key-results`
  );
  return response.data;
}

export async function createKeyResult(objectiveId, payload) {
  const response = await axiosInstance.post(
    `/api/v1/objectives/${objectiveId}/key-results`,
    payload
  );
  return response.data;
}
