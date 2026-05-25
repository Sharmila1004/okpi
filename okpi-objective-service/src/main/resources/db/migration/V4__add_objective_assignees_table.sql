CREATE TABLE objective_assignees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    objective_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_objective_assignee_objective_id (objective_id),
    INDEX idx_objective_assignee_user_id (user_id),
    CONSTRAINT fk_objective_assignee_objective FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
