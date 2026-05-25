ALTER TABLE key_results
    ADD COLUMN updated_by_user_id BIGINT NULL AFTER status;
