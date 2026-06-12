package com.laerdal.okpi.auth.service.impl;

import com.laerdal.okpi.auth.dto.response.NotificationResponse;
import com.laerdal.okpi.auth.entity.Notification;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.exception.AccessDeniedException;
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

/**
 * CHANGED:
 *  - Added markAsRead(email, notificationId) — sets read=true on a single
 *    notification owned by the current user.
 *  - Added markAllAsRead(email) — sets read=true on all unread notifications
 *    for the current user.
 */
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

    @Override
    @Transactional
    public NotificationResponse markAsRead(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Cannot modify another user's notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }
        return notificationMapper.toResponse(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(user.getId());
        unread.forEach(n -> n.setRead(true));
        if (!unread.isEmpty()) {
            notificationRepository.saveAll(unread);
        }
    }
}
