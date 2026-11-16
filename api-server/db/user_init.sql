/** 
* Autor: Luca Lammers

*/


--creates the db-tables for user, their stats/goals and Sessions

CREATE TABLE IF NOT EXISTS users (
  "id"          VARCHAR(36)  PRIMARY KEY,
  "email"       TEXT UNIQUE NOT NULL,
  "emailHash"   VARCHAR(64) UNIQUE,
  "createdAt"   BIGINT       NOT NULL,
  "firstName"   TEXT, 
  "lastName"    TEXT, 
  "role"        VARCHAR(20)  NOT NULL DEFAULT 'User',
  "password"    VARCHAR(255) NOT NULL,
  "securityQuestionKey" VARCHAR(64),
  "securityAnswerHash"  VARCHAR(255),
  "isDeactivated"   BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_stats (
  "id"               VARCHAR(36) PRIMARY KEY,
  "createdAt"        BIGINT      NOT NULL,
  "userId"           VARCHAR(36) NOT NULL UNIQUE REFERENCES users("id") ON DELETE CASCADE,
  "weight"           TEXT,
  "height"           TEXT,
  "birthDate"        TEXT,
  "dailyCalorieGoal" TEXT,
  "dailyProteinGoal" TEXT,
  "dailyFatGoal"     TEXT,
  "dailyCarbsGoal"   TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  "id"               VARCHAR(36) PRIMARY KEY,
  "userId"           VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "startedAt"        BIGINT,
  "finishedAt"       BIGINT      DEFAULT NULL,
  "isFinished"       BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  "id"               VARCHAR(36) PRIMARY KEY,
  "userId"           VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "tokenHash"        VARCHAR(64) NOT NULL UNIQUE,
  "createdAt"        BIGINT      NOT NULL,
  "expiresAt"        BIGINT      NOT NULL,
  "usedAt"           BIGINT      DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_attempts (
  "id"               VARCHAR(36) PRIMARY KEY,
  "userId"           VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "createdAt"        BIGINT      NOT NULL
);
