import axiosInstance from "./axiosInstance";
import { STORAGE_KEYS } from "../utils/constants";

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

export async function logout(userId) {
  if (!userId) {
    return;
  }

  await axiosInstance.post(`/api/v1/auth/logout/${userId}`);
}

export async function getProfile() {
  const storedUser = window.localStorage.getItem(STORAGE_KEYS.user);
  return storedUser ? JSON.parse(storedUser) : null;
}
