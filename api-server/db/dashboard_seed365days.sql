/**
 * Autor: Luca Lammers

 * Made by AI
 */

-- 365-day dashboard activity seed data for example2@example.test (Bob)
-- and example3@example.test (Clara).
-- Dates are calculated relative to CURRENT_DATE so the user dashboard activity
-- heatmap always has data in the last 365 days after a fresh database initialization.
--
-- Required execution order:
--   user_init.sql -> user_demoData.sql -> dashboard_seed365days.sql
--
-- The seed is idempotent for the current rolling 365-day window:
-- existing user_sessions for Bob/Clara in that window are deleted before insert.

DO $$
DECLARE
  bob_id   TEXT := '5a1bafbd-8901-48c6-910a-33d1b6918176';
  clara_id TEXT := '241ec06f-c075-4da0-9e43-7ace6c837875';

  start_day DATE := CURRENT_DATE - 364;
  end_day   DATE := CURRENT_DATE;
  start_ms  BIGINT;
  end_ms    BIGINT;

  d INT;
  u INT;
  current_day DATE;
  day_ms BIGINT;
  session_start_ms BIGINT;
  duration_min INT;
  login_count INT;
  login_index INT;
  user_id TEXT;
BEGIN
  start_ms := EXTRACT(EPOCH FROM (start_day::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000;
  end_ms := EXTRACT(EPOCH FROM ((end_day + 1)::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000 - 1;

  DELETE FROM user_sessions
    WHERE "userId" IN (bob_id, clara_id)
      AND "startedAt" BETWEEN start_ms AND end_ms;

  -- d=0 is 364 days ago, d=364 is today.
  FOR d IN 0..364 LOOP
    current_day := start_day + d;
    day_ms := EXTRACT(EPOCH FROM (current_day::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000;

    FOR u IN 1..2 LOOP
      user_id := CASE u
        WHEN 1 THEN bob_id
        ELSE        clara_id
      END;

      -- Random distribution: 0..3 logins per user/day.
      login_count := FLOOR(random() * 4)::INT;

      FOR login_index IN 1..login_count LOOP
        session_start_ms := day_ms
          + (6 + FLOOR(random() * 16)::INT) * 60 * 60 * 1000
          + FLOOR(random() * 60)::INT * 60 * 1000;
        duration_min := 20 + FLOOR(random() * 86)::INT;

        INSERT INTO user_sessions ("id", "userId", "startedAt", "finishedAt", "isFinished")
          VALUES (
            gen_random_uuid()::TEXT,
            user_id,
            session_start_ms,
            session_start_ms + duration_min * 60 * 1000,
            TRUE
          );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;
