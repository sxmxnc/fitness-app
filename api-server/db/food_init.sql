/**
 * Autor: Simon Josef Cebula

 */


--creates the db-tables for foods, meal-entries and meal-entry-foods

-- 1. foods
CREATE TABLE IF NOT EXISTS foods (
    "id"              VARCHAR(36)  PRIMARY KEY,
    "userId"          VARCHAR(36)  REFERENCES users("id") ON DELETE CASCADE,
    "name"            VARCHAR(255) NOT NULL,
    "caloriesPer100g" INTEGER,
    "proteinPer100g"  INTEGER,
    "fatPer100g"      INTEGER,
    "carbsPer100g"    INTEGER,
    "isSystemProperty" BOOLEAN     NOT NULL DEFAULT FALSE,
    "isDeleted"       BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 2. meal_entries
CREATE TABLE IF NOT EXISTS meal_entries (
    "id"        VARCHAR(36) PRIMARY KEY,
    "userId"    VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    "entryDate" BIGINT      NOT NULL,
    "mealType"  VARCHAR(20) NOT NULL CHECK ("mealType" IN ('breakfast', 'lunch', 'dinner', 'snack')),
    "createdAt" BIGINT      NOT NULL,
    "isDeleted" BOOLEAN     NOT NULL DEFAULT FALSE
);

-- 3. meal_entry_foods
CREATE TABLE IF NOT EXISTS meal_entry_foods (
    "id"              VARCHAR(36) PRIMARY KEY,
    "mealEntryId"     VARCHAR(36) NOT NULL REFERENCES meal_entries("id") ON DELETE CASCADE,
    "foodId"          VARCHAR(36) NOT NULL REFERENCES foods("id") ON DELETE CASCADE,
    "quantityGrams"   INTEGER     NOT NULL,
    -- nullable per-entry macro overrides; when set, take precedence over the linked food row
    "caloriesPer100g" INTEGER     DEFAULT NULL,
    "proteinPer100g"  INTEGER     DEFAULT NULL,
    "fatPer100g"      INTEGER     DEFAULT NULL,
    "carbsPer100g"    INTEGER     DEFAULT NULL
);
