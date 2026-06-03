package com.laerdal.okpi.auth.controller;

import com.laerdal.okpi.auth.dto.response.NotificationResponse;
import com.laerdal.okpi.auth.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        if (authentication == null || authentication.getName() == null) {
            throw new com.laerdal.okpi.auth.exception.AuthenticationException("Unauthenticated");
        }
        return notificationService.getCurrentUserNotifications(authentication.getName());
    }

    /**
     * Service-to-service endpoint used by other microservices to persist notifications centrally.
     * Accepts a map of userId -> message. Caller must authenticate (service token / internal auth).
     */
    @PostMapping
    @Operation(summary = "Create notifications (service-to-service)")
    public void createNotifications(@RequestBody Map<Long, String> notifications) {
        notificationService.createNotifications(notifications);
    }
}
