package com.laerdal.okpi.auth.repository;

import com.laerdal.okpi.auth.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** NEW: used by markAsRead to ensure a user can only mark their own notifications. */
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /** NEW: used by markAllAsRead. */
    List<Notification> findByUserIdAndReadFalse(Long userId);
}
