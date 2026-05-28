package com.laerdal.okpi.objective.controller;

import com.laerdal.okpi.objective.entity.Notification;
import com.laerdal.okpi.objective.repository.NotificationRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final RequestContext requestContext;

    // Get notifications for logged-in user
    @GetMapping
    public List<Notification> getMyNotifications() {
        Long userId = requestContext.getUserId();
        return notificationRepository.findByUserId(userId);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}