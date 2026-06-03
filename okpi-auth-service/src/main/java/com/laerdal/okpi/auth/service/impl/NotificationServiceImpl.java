package com.laerdal.okpi.auth.service.impl;

import com.laerdal.okpi.auth.dto.response.NotificationResponse;
import com.laerdal.okpi.auth.entity.Notification;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.exception.ResourceNotFoundException;
import com.laerdal.okpi.auth.mapper.NotificationMapper;
import com.laerdal.okpi.auth.repository.NotificationRepository;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository,
                                   NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationMapper = notificationMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getCurrentUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void createNotifications(Map<Long, String> notificationsByUserId) {
        if (notificationsByUserId == null || notificationsByUserId.isEmpty()) {
            return;
        }

        List<Notification> notifications = new ArrayList<>();
        notificationsByUserId.forEach((userId, message) -> {
            if (userId == null || !StringUtils.hasText(message)) {
                return;
            }

            notifications.add(Notification.builder()
                    .userId(userId)
                    .message(message.trim())
                    .read(false)
                    .build());
        });

        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }
    }
}
