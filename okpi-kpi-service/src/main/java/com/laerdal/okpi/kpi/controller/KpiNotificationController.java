package com.laerdal.okpi.kpi.controller;

import com.laerdal.okpi.kpi.entity.Notification;
import com.laerdal.okpi.kpi.repository.NotificationRepository;
import com.laerdal.okpi.kpi.security.RequestContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class KpiNotificationController {

    private final NotificationRepository notificationRepository;
    private final RequestContext requestContext;

    public KpiNotificationController(NotificationRepository notificationRepository,
                                     RequestContext requestContext) {
        this.notificationRepository = notificationRepository;
        this.requestContext = requestContext;
    }

    @GetMapping
    public List<Notification> getNotifications() {
        Long userId = requestContext.getUserId();
        return notificationRepository.findByUserId(userId);
    }
}
