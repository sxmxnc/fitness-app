/**
* Autor: Justus Heinz

*/


-- 1. exercises
CREATE TABLE IF NOT EXISTS exercises (
    "id"               VARCHAR(36)  PRIMARY KEY,
    "userId"           VARCHAR(36)  REFERENCES users("id") ON DELETE CASCADE,
    "name"             VARCHAR(255) NOT NULL,
    "type"             VARCHAR(20)  NOT NULL CHECK ("type" IN ('weighted', 'bodyweight', 'cardio')),
    "description"      TEXT,
    "muscleGroup"      VARCHAR(100),
    "isDeleted"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "isSystemProperty" BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 2. workout_plans
CREATE TABLE IF NOT EXISTS workout_plans (
    "id"               VARCHAR(36)  PRIMARY KEY,
    "userId"           VARCHAR(36)  REFERENCES users("id") ON DELETE CASCADE,
    "name"             VARCHAR(255) NOT NULL,
    "description"      TEXT,
    "createdAt"        BIGINT,
    "isDeleted"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "isSystemProperty" BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 3. workout_plan_exercises
CREATE TABLE IF NOT EXISTS workout_plan_exercises (
    "id"                   VARCHAR(36) PRIMARY KEY,
    "workoutPlanId"        VARCHAR(36) NOT NULL REFERENCES workout_plans("id") ON DELETE CASCADE,
    "exerciseId"           VARCHAR(36) NOT NULL REFERENCES exercises("id") ON DELETE CASCADE,
    "exerciseOrder"        INTEGER,
    "targetSets"           INTEGER     DEFAULT NULL,
    "targetReps"           INTEGER     DEFAULT NULL,
    "targetWeight"         INTEGER     DEFAULT NULL,
    "targetDurationMinutes" INTEGER    DEFAULT NULL
);

-- 4. workout_sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
    "id"            VARCHAR(36) PRIMARY KEY,
    "userId"        VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    "workoutPlanId" VARCHAR(36)          REFERENCES workout_plans("id") ON DELETE SET NULL DEFAULT NULL,
    "workoutDate"   BIGINT,
    "startedAt"     BIGINT,
    "finishedAt"    BIGINT               DEFAULT NULL,
    "notes"         TEXT,
    "isDeleted"     BOOLEAN     NOT NULL DEFAULT FALSE
);

-- 5. workout_session_exercises
CREATE TABLE IF NOT EXISTS workout_session_exercises (
    "id"               VARCHAR(36) PRIMARY KEY,
    "workoutSessionId" VARCHAR(36) NOT NULL REFERENCES workout_sessions("id") ON DELETE CASCADE,
    "exerciseId"       VARCHAR(36) NOT NULL REFERENCES exercises("id") ON DELETE CASCADE,
    "exerciseOrder"    INTEGER,
    "actualSets"       INTEGER     DEFAULT NULL,
    "actualReps"       INTEGER     DEFAULT NULL,
    "actualWeight"     INTEGER     DEFAULT NULL,
    "actualDurationMinutes" INTEGER DEFAULT NULL,
    "notes"            TEXT
);

-- 6. user_plan_order
CREATE TABLE IF NOT EXISTS user_plan_order (
    "userId"   VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    "planId"   VARCHAR(36) NOT NULL,
    "position" INTEGER     NOT NULL,
    PRIMARY KEY ("userId", "planId")
);

