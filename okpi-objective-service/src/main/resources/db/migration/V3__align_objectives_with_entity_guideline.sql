ALTER TABLE objectives
    MODIFY description TEXT NULL,
    MODIFY status VARCHAR(30) NOT NULL,
    MODIFY progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN start_date DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER status,
    ADD COLUMN end_date DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER start_date,
    ADD COLUMN is_deleted BIT(1) NOT NULL DEFAULT b'0' AFTER progress_percentage;

UPDATE objectives
SET start_date = CURRENT_DATE,
    end_date = CURRENT_DATE
WHERE start_date IS NULL
   OR end_date IS NULL;
