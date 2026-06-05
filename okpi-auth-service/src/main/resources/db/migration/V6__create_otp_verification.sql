CREATE TABLE IF NOT EXISTS otp_verification (
                                  id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                  email VARCHAR(255),
                                  otp VARCHAR(10),
                                  expiry_time DATETIME
);