CREATE TABLE kpi_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kpi_definition_id BIGINT NOT NULL,
    value DECIMAL(19,4) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    note VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kpi_entries_definition
        FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id)
            ON DELETE CASCADE,
    INDEX idx_kpi_entries_definition_id (kpi_definition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
