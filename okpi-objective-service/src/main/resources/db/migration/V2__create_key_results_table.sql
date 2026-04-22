CREATE TABLE key_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    objective_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    metric_type VARCHAR(30) NOT NULL,
    start_value DECIMAL(19,4),
    current_value DECIMAL(19,4),
    target_value DECIMAL(19,4),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_key_results_objective
        FOREIGN KEY (objective_id) REFERENCES objectives(id)
            ON DELETE CASCADE,
    INDEX idx_key_results_objective_id (objective_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
