import axiosInstance from "./axiosInstance";
import { STORAGE_KEYS } from "../utils/constants";

// ====================== AUTH ======================
export async function login(payload) {
  const response = await axiosInstance.post("/api/v1/auth/login", payload);
  return response.data;
}

export async function register(payload) {
  const response = await axiosInstance.post("/api/v1/auth/register", payload);
  return response.data;
}

export async function refreshToken(payload) {
  const response = await axiosInstance.post("/api/v1/auth/refresh", payload);
  return response.data;
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await axiosInstance.post("/api/v1/auth/logout", { refreshToken });
}

// ====================== PROFILE ======================
export async function getCurrentUser() {
  const response = await axiosInstance.get("/api/v1/auth/me");
  return response.data;
}

export async function updateCurrentUser(payload) {
  const response = await axiosInstance.put("/api/v1/auth/me", payload);
  return response.data;
}

// ====================== ADMIN USER MANAGEMENT ======================
export async function getUsers(params = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));
  if (params.role) searchParams.set("role", params.role);

  const response = await axiosInstance.get(`/api/v1/auth/users?${searchParams}`);
  return response.data;
}

export async function getUsersSummary(userIds = []) {
  if (!userIds.length) return [];
  const searchParams = new URLSearchParams();
  userIds.forEach(id => searchParams.append("ids", String(id)));

  const response = await axiosInstance.get(`/api/v1/auth/users/summary?${searchParams}`);
  return response.data;
}

export async function getUserById(userId) {
  const response = await axiosInstance.get(`/api/v1/auth/users/${userId}`);
  return response.data;
}

export async function updateUserByAdmin(userId, payload) {
  const response = await axiosInstance.put(`/api/v1/auth/users/${userId}`, payload);
  return response.data;
}

export async function deleteUser(userId) {
  await axiosInstance.delete(`/api/v1/auth/users/${userId}`);
}

export async function changeUserRole(userId, role) {
  const response = await axiosInstance.put(`/api/v1/auth/users/${userId}/role`, { role });
  return response.data;
}

export async function changeUserStatus(userId, isActive) {
  const response = await axiosInstance.put(`/api/v1/auth/users/${userId}/status`, { isActive });
  return response.data;
}

// ====================== MANAGER TEAM ======================
export async function assignManagerTeam(managerId, memberIds = []) {
  const response = await axiosInstance.put(
      `/api/v1/auth/users/managers/${managerId}/team`,
      { memberIds }
  );
  return response.data;
}

export async function getTeamMembers(managerId) {
  const response = await axiosInstance.get(
      `/api/v1/auth/users/managers/${managerId}/team`
  );
  return response.data;
}

// ====================== NOTIFICATIONS ======================
export async function getNotifications(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.size != null) searchParams.set("size", String(params.size));

  const response = await axiosInstance.get(`/api/v1/notifications?${searchParams}`);
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await axiosInstance.post(`/api/v1/notifications/${notificationId}/read`);
  return response.data;
}