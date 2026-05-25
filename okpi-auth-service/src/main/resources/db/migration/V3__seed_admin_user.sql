INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
           'admin@okpi.com',
           'test123',
           'Admin',
           'User',
           'ADMIN',
           true,
           NOW(),
           NOW()
       );