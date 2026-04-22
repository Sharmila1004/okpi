import axiosInstance from "./axiosInstance";

export async function getKpis() {
  const response = await axiosInstance.get("/api/v1/kpis");
  return response.data;
}

export async function getKpi(kpiId) {
  const response = await axiosInstance.get(`/api/v1/kpis/${kpiId}`);
  return response.data.kpi ?? response.data;
}

export async function createKpi(payload) {
  const response = await axiosInstance.post("/api/v1/kpis", payload);
  return response.data;
}

export async function updateKpi(kpiId, payload) {
  const response = await axiosInstance.put(`/api/v1/kpis/${kpiId}`, payload);
  return response.data;
}

export async function deleteKpi(kpiId) {
  const response = await axiosInstance.delete(`/api/v1/kpis/${kpiId}`);
  return response.data;
}

export async function getKpiEntries(kpiId) {
  const response = await axiosInstance.get(`/api/v1/kpis/${kpiId}/entries`);
  return response.data;
}

export async function recordEntry(kpiId, payload) {
  const response = await axiosInstance.post(`/api/v1/kpis/${kpiId}/entries`, payload);
  return response.data;
}
