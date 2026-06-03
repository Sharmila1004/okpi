-- Preserve the seeded admin account, but store the password using the same BCrypt cost
-- the application uses at runtime.
UPDATE users
SET password_hash = '$2a$12$zwCi8.AfWwupW7A61zOzg.ynGuJQJVOyOFkIT/TaHcPNTIlJpUYwS'
WHERE email = 'admin@okpi.com';
