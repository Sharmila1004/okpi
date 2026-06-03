package com.laerdal.okpi.auth.service;

import com.laerdal.okpi.auth.dto.response.NotificationResponse;

import java.util.List;
import java.util.Map;

public interface NotificationService {

    List<NotificationResponse> getCurrentUserNotifications(String email);

    void createNotifications(Map<Long, String> notificationsByUserId);
}
