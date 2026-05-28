import axiosInstance from "./axiosInstance";

export async function getNotifications() {
    const response = await axiosInstance.get("/api/v1/notifications");
    return response.data;
}