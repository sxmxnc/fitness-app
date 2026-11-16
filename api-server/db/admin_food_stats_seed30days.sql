/**
 * Autor: Luca Lammers

 * Made by AI
 */

-- 30-day food-tracking stats seed data for every non-admin user.
-- This feeds GET /api/admin/stats/food/:userId.
--
-- Required execution order:
--   user_init.sql -> user_demoData.sql -> user_sessionData.sql
--   -> food_init.sql -> food_demoData.sql -> admin_food_stats_seed30days.sql
--
-- The seed is idempotent for the current rolling 30-day window:
-- existing meal_entries for non-admin users in that window are deleted before insert.

DO $$
DECLARE
  haehnchen_id      TEXT := '70d99d57-9637-4104-bb5f-a56fcda9b1d1';
  lachs_id          TEXT := '88b5124d-dc05-4d46-b82f-bb65beeb594a';
  thunfisch_id      TEXT := '9cd5fed6-aa8d-4608-9c2e-74274fffb531';
  ei_id             TEXT := 'f64dbf20-6199-43ef-b4d4-ddbcc7af8e50';
  joghurt_id        TEXT := 'e9e4924e-555b-4928-a682-7f6d4a6c9ca0';
  reis_id           TEXT := '8cba5383-3ede-4ad3-93cb-f7b36ccbc216';
  haferflocken_id   TEXT := 'd98122d1-5663-4a92-907b-c6a540e7b94f';
  nudeln_id         TEXT := '78009d75-abe5-4e7f-9955-ccf62c9fa101';
  suesskartoffel_id TEXT := '8196ad2f-7c6d-449e-9548-3fe63640139a';
  banane_id         TEXT := '35c03dd5-e143-4bbe-bcb3-24f2e53b614a';
  brokkoli_id       TEXT := 'c4be178b-e6c5-4e62-8e2b-929201868f8d';
  spinat_id         TEXT := '5234cd54-4ec0-43dd-b84a-3328ef3536d9';
  apfel_id          TEXT := '2fadd54c-fb06-4e27-8a18-51724649c47d';
  mandeln_id        TEXT := 'daf5e856-78da-4068-b3cb-c429c419f276';
  milch_id          TEXT := '0890b512-36de-40c4-a566-19e2dfa28497';

  start_day DATE := CURRENT_DATE - 29;
  end_day   DATE := CURRENT_DATE;
  start_ms  BIGINT;
  end_ms    BIGINT;

  user_rec RECORD;
  d INT;
  current_day DATE;
  entry_ms BIGINT;
  entry_id TEXT;
  protein_food TEXT;
  carb_food TEXT;
  veg_food TEXT;
  user_offset INT;
BEGIN
  start_ms := EXTRACT(EPOCH FROM (start_day::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000;
  end_ms := EXTRACT(EPOCH FROM ((end_day + 1)::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000 - 1;

  DELETE FROM meal_entries
    WHERE "userId" IN (SELECT "id" FROM users WHERE "role" != 'admin')
      AND "entryDate" BETWEEN start_ms AND end_ms;

  FOR user_rec IN
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id")::INT AS user_index
    FROM users
    WHERE "role" != 'admin'
  LOOP
    user_offset := user_rec.user_index;

    -- d=0 is 29 days ago, d=29 is today.
    FOR d IN 0..29 LOOP
      current_day := start_day + d;
      entry_ms := EXTRACT(EPOCH FROM (current_day::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000;

      entry_id := gen_random_uuid()::TEXT;
      INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
        VALUES (entry_id, user_rec.id, entry_ms, 'breakfast', entry_ms, FALSE);

      INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
        (gen_random_uuid()::TEXT, entry_id, haferflocken_id, 60 + FLOOR(random() * 61)::INT),
        (gen_random_uuid()::TEXT, entry_id, milch_id, 180 + FLOOR(random() * 121)::INT),
        (gen_random_uuid()::TEXT, entry_id, banane_id, 80 + FLOOR(random() * 81)::INT);

      IF random() < 0.45 THEN
        INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams")
          VALUES (gen_random_uuid()::TEXT, entry_id, joghurt_id, 120 + FLOOR(random() * 121)::INT);
      END IF;

      entry_id := gen_random_uuid()::TEXT;
      INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
        VALUES (entry_id, user_rec.id, entry_ms, 'lunch', entry_ms, FALSE);

      protein_food := CASE (d + user_offset) % 3
        WHEN 0 THEN haehnchen_id
        WHEN 1 THEN lachs_id
        ELSE        thunfisch_id
      END;
      carb_food := CASE (d + user_offset) % 2 WHEN 0 THEN reis_id ELSE nudeln_id END;
      veg_food := CASE d % 2 WHEN 0 THEN brokkoli_id ELSE spinat_id END;

      INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
        (gen_random_uuid()::TEXT, entry_id, protein_food, 130 + FLOOR(random() * 111)::INT),
        (gen_random_uuid()::TEXT, entry_id, carb_food, 120 + FLOOR(random() * 121)::INT),
        (gen_random_uuid()::TEXT, entry_id, veg_food, 80 + FLOOR(random() * 81)::INT);

      entry_id := gen_random_uuid()::TEXT;
      INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
        VALUES (entry_id, user_rec.id, entry_ms, 'dinner', entry_ms, FALSE);

      protein_food := CASE (d + user_offset + 1) % 3
        WHEN 0 THEN haehnchen_id
        WHEN 1 THEN ei_id
        ELSE        lachs_id
      END;

      INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
        (gen_random_uuid()::TEXT, entry_id, protein_food, 120 + FLOOR(random() * 101)::INT),
        (gen_random_uuid()::TEXT, entry_id, suesskartoffel_id, 150 + FLOOR(random() * 121)::INT),
        (gen_random_uuid()::TEXT, entry_id, spinat_id, 70 + FLOOR(random() * 61)::INT);

      IF random() < 0.65 THEN
        entry_id := gen_random_uuid()::TEXT;
        INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
          VALUES (entry_id, user_rec.id, entry_ms, 'snack', entry_ms, FALSE);
        INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
          (gen_random_uuid()::TEXT, entry_id, apfel_id, 120 + FLOOR(random() * 81)::INT),
          (gen_random_uuid()::TEXT, entry_id, mandeln_id, 15 + FLOOR(random() * 26)::INT);
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
