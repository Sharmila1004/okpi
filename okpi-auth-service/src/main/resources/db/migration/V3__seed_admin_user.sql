-- Password: Admin@123 (BCrypt hashed)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
           'admin@okpi.com',
           '$2a$12$LJ3m4ys4VzpXoBSKOCvxnOWHOBGnMsPaq5.GKRZ0HLbTTgFJYPWm.',
           'System',
           'Admin',
           'ADMIN'
       );
