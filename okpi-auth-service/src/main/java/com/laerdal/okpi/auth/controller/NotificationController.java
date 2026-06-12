package com.laerdal.okpi.auth.controller;

import com.laerdal.okpi.auth.dto.response.NotificationResponse;
import com.laerdal.okpi.auth.exception.AuthenticationException;
import com.laerdal.okpi.auth.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * CHANGED:
 *  - Added POST /api/v1/notifications/{id}/read — marks one notification as read.
 *    (Matches the markNotificationRead(notificationId) call already present in
 *    the frontend's authApi.js.)
 *  - Added POST /api/v1/notifications/read-all — marks all of the current
 *    user's notifications as read (used for "open dropdown clears badge").
 */
@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Current user notification APIs")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get notifications for the authenticated user")
    public List<NotificationResponse> getNotifications(Authentication authentication) {
        requireAuth(authentication);
        return notificationService.getCurrentUserNotifications(authentication.getName());
    }

    /**
     * Service-to-service endpoint used by other microservices to persist
     * notifications centrally. Accepts a map of userId -> message.
     */
    @PostMapping
    @Operation(summary = "Create notifications (service-to-service)")
    public void createNotifications(@RequestBody Map<Long, String> notifications) {
        notificationService.createNotifications(notifications);
    }

    /** NEW: mark a single notification as read. */
    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public NotificationResponse markAsRead(@PathVariable("id") Long id,
                                           Authentication authentication) {
        requireAuth(authentication);
        return notificationService.markAsRead(authentication.getName(), id);
    }

    /** NEW: mark all of the current user's notifications as read. */
    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for the current user")
    public void markAllAsRead(Authentication authentication) {
        requireAuth(authentication);
        notificationService.markAllAsRead(authentication.getName());
    }

    private void requireAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthenticationException("Unauthenticated");
        }
    }
}
