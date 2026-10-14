-- Self-registration: SHA-256 of the client IP (NULL for users added by scripts/add-user.mjs).
ALTER TABLE users ADD COLUMN signup_key TEXT;
CREATE INDEX users_signup ON users(signup_key, created_at);
