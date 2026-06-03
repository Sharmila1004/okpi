-- Add manager_id to users table
ALTER TABLE users
    ADD COLUMN manager_id BIGINT NULL DEFAULT NULL;

ALTER TABLE users
    ADD INDEX idx_users_manager_id (manager_id);

-- Create notifications table in the auth database
CREATE TABLE notifications (
                               id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                               user_id    BIGINT       NOT NULL,
                               message    VARCHAR(500) NOT NULL,
                               is_read    TINYINT(1)   NOT NULL DEFAULT 0,
                               created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               INDEX idx_notifications_user_id (user_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
