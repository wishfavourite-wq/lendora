-- MySQL init script — runs once on first container start
-- Creates the lendora database and grants privileges to the app user.
-- The Prisma migration handles all table DDL; this script only handles
-- database-level setup that must exist before migrations can run.

CREATE DATABASE IF NOT EXISTS lendora
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Ensure the app user has full access to the lendora DB only.
-- The user is created by MYSQL_USER env var in docker-compose; this
-- statement is idempotent on re-runs.
GRANT ALL PRIVILEGES ON lendora.* TO 'lendora'@'%';
FLUSH PRIVILEGES;
