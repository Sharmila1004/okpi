CREATE TABLE notifications (
                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               user_id BIGINT NOT NULL,
                               message VARCHAR(500),
                               is_read BOOLEAN,
                               created_at TIMESTAMP
);
