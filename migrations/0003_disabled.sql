-- Deactivated accounts (scripts/user-status.mjs): hidden from the player list, no login, sessions refused; progress kept.
ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0;
