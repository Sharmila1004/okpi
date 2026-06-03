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
           '$2a$12$p8nYHsloUlptM970PYz2MuN7nU5rE9EuhBDckx0q5V/jD8fQr1REu',
           'Admin',
           'User',
           'ADMIN',
           true,
           NOW(),
           NOW()
       );
