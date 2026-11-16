/**
 * Autor: Simon Josef Cebula

 */

-- 30-day meal seed data for all active users (Alice, Bob, Clara, David, Emma, Felix)
-- Timo (deactivated) is excluded.
-- Dates are calculated relative to CURRENT_DATE so data always falls in the last 30 days.
-- Run once per fresh DB setup; running twice inserts duplicate entries.
--
-- Required execution order:
--   user_init.sql -> food_init.sql -> user_demoData.sql -> food_demoData.sql -> food_seed30days.sql
-- food_demoData.sql must run first: this file references user-specific food IDs
-- (Proteinshake, Erdnussbutter, Smoothie-Mix) inserted there.
-- seed Data created with AI

DO $$
DECLARE
  -- User IDs (from user_demoData.sql)
  alice_id  TEXT := 'ceda8624-e813-459a-899d-0c57e37e0417';
  bob_id    TEXT := '5a1bafbd-8901-48c6-910a-33d1b6918176';
  clara_id  TEXT := '241ec06f-c075-4da0-9e43-7ace6c837875';
  david_id  TEXT := 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c';
  emma_id   TEXT := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  felix_id  TEXT := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

  -- System food IDs (from food_demoData.sql)
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

  -- User-specific foods for example1-example3 (from food_demoData.sql)
  alice_shake_id    TEXT := '628ed309-958f-4585-94b2-a0296b88e2c4';
  bob_peanut_id     TEXT := '384e7e27-e6b8-48bd-8f0d-88372488188a';
  clara_smoothie_id TEXT := 'd8ff5dc3-5281-47a0-80b7-9df7e4e1c446';

  d            INT;
  u            INT;
  current_day  DATE;
  entry_ms     BIGINT;
  user_id      TEXT;
  entry_id     TEXT;
  protein_food TEXT;
  carb_food    TEXT;
  veg_food     TEXT;
BEGIN
  -- d=0 is 29 days ago, d=29 is today
  FOR d IN 0..29 LOOP
    current_day := CURRENT_DATE - (29 - d);
    entry_ms    := EXTRACT(EPOCH FROM (current_day::TIMESTAMP AT TIME ZONE 'UTC'))::BIGINT * 1000;

    -- u=1 Alice, u=2 Bob, u=3 Clara, u=4 David, u=5 Emma, u=6 Felix
    FOR u IN 1..6 LOOP
      CASE u
        WHEN 1 THEN user_id := alice_id;
        WHEN 2 THEN user_id := bob_id;
        WHEN 3 THEN user_id := clara_id;
        WHEN 4 THEN user_id := david_id;
        WHEN 5 THEN user_id := emma_id;
        ELSE        user_id := felix_id;
      END CASE;

      -- BREAKFAST: Haferflocken-days alternating with Joghurt-days
      entry_id := gen_random_uuid()::TEXT;
      INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
        VALUES (entry_id, user_id, entry_ms, 'breakfast', entry_ms, FALSE);

      IF d % 2 = 0 THEN
        INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
          (gen_random_uuid()::TEXT, entry_id, haferflocken_id, 80 + (d % 3) * 10),
          (gen_random_uuid()::TEXT, entry_id, milch_id,        200),
          (gen_random_uuid()::TEXT, entry_id, banane_id,       120);
      ELSE
        -- ((u-1) % 3) keeps quantities in a reasonable range for all 6 users
        INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
          (gen_random_uuid()::TEXT, entry_id, joghurt_id, 200),
          (gen_random_uuid()::TEXT, entry_id, ei_id,      100 + ((u - 1) % 3) * 50);
        -- User-specific food only for example1-example3; others get Banane
        IF u = 1 THEN
          INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams")
            VALUES (gen_random_uuid()::TEXT, entry_id, alice_shake_id, 300);
        ELSIF u = 2 THEN
          INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams")
            VALUES (gen_random_uuid()::TEXT, entry_id, bob_peanut_id, 20);
        ELSIF u = 3 THEN
          INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams")
            VALUES (gen_random_uuid()::TEXT, entry_id, clara_smoothie_id, 250);
        ELSE
          INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams")
            VALUES (gen_random_uuid()::TEXT, entry_id, banane_id, 100);
        END IF;
      END IF;

      -- LUNCH: rotating protein (Hähnchen/Lachs/Thunfisch), carb and veg
      entry_id := gen_random_uuid()::TEXT;
      INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
        VALUES (entry_id, user_id, entry_ms, 'lunch', entry_ms, FALSE);

      CASE d % 3
        WHEN 0 THEN protein_food := haehnchen_id;
        WHEN 1 THEN protein_food := lachs_id;
        ELSE        protein_food := thunfisch_id;
      END CASE;
      carb_food := CASE d % 2 WHEN 0 THEN reis_id     ELSE nudeln_id  END;
      veg_food  := CASE d % 2 WHEN 0 THEN brokkoli_id ELSE spinat_id  END;

      INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
        (gen_random_uuid()::TEXT, entry_id, protein_food, 150 + ((u - 1) % 3) * 30 + (d % 3) * 20),
        (gen_random_uuid()::TEXT, entry_id, carb_food,    150 + (d % 4) * 20),
        (gen_random_uuid()::TEXT, entry_id, veg_food,     80  + (d % 3) * 15);

      -- DINNER: different protein rotation from lunch
      entry_id := gen_random_uuid()::TEXT;
      INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
        VALUES (entry_id, user_id, entry_ms, 'dinner', entry_ms, FALSE);

      CASE (d + 1) % 3
        WHEN 0 THEN protein_food := haehnchen_id;
        WHEN 1 THEN protein_food := lachs_id;
        ELSE        protein_food := ei_id;
      END CASE;

      INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
        (gen_random_uuid()::TEXT, entry_id, protein_food,      150 + ((u - 1) % 3) * 30),
        (gen_random_uuid()::TEXT, entry_id, suesskartoffel_id, 180 + (d % 3) * 20),
        (gen_random_uuid()::TEXT, entry_id, spinat_id,         80);

      -- SNACK: every other day (Apfel + Mandeln)
      IF d % 2 = 0 THEN
        entry_id := gen_random_uuid()::TEXT;
        INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
          VALUES (entry_id, user_id, entry_ms, 'snack', entry_ms, FALSE);
        INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
          (gen_random_uuid()::TEXT, entry_id, apfel_id,   150),
          (gen_random_uuid()::TEXT, entry_id, mandeln_id, 30);
      END IF;

    END LOOP;
  END LOOP;
END;
$$;
