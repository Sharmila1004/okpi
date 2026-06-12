package com.laerdal.okpi.auth.service;

import com.laerdal.okpi.auth.dto.response.NotificationResponse;
import java.util.List;
import java.util.Map;

public interface NotificationService {
    List<NotificationResponse> getCurrentUserNotifications(String email);
    void createNotifications(Map<Long, String> notificationsByUserId);

    /** NEW: mark a single notification as read for the current user. */
    NotificationResponse markAsRead(String email, Long notificationId);

    /** NEW: mark all of the current user's notifications as read. */
    void markAllAsRead(String email);
}
