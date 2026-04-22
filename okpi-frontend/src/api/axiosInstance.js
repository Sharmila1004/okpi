import axios from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "../utils/constants";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

let isRefreshing = false;
let queuedRequests = [];

function getStoredToken(key) {
  return window.localStorage.getItem(key);
}

function setStoredToken(key, value) {
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, value);
}

function flushQueue(error, token = null) {
  queuedRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });

  queuedRequests = [];
}

axiosInstance.interceptors.request.use((config) => {
  const token = getStoredToken(STORAGE_KEYS.accessToken);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/api/v1/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getStoredToken(STORAGE_KEYS.refreshToken);

    if (!refreshToken) {
      window.localStorage.removeItem(STORAGE_KEYS.accessToken);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queuedRequests.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refreshToken
      });

      const { accessToken, refreshToken: nextRefreshToken } = response.data;
      setStoredToken(STORAGE_KEYS.accessToken, accessToken);
      setStoredToken(STORAGE_KEYS.refreshToken, nextRefreshToken);
      flushQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      setStoredToken(STORAGE_KEYS.accessToken, null);
      setStoredToken(STORAGE_KEYS.refreshToken, null);
      setStoredToken(STORAGE_KEYS.user, null);
      flushQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
