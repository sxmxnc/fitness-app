/**
 * Autor: Simon Josef Cebula

 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Food } from '../models/food_entitys/food.js';
import { MealEntry } from '../models/food_entitys/meal_entry.js';
import { MealEntryFood, MealEntryFoodWithNutrition } from '../models/food_entitys/meal_entry_food.js';

export class FoodDao {
	constructor(private readonly client: Pool) {}

	/**
	 * returns all system foods and the user's own foods
	 * @param userId - the UUID of the user
	 * @returns list of available foods
	 */
	async getAllFoods(userId: string): Promise<Food[]> {
		const result = await this.client.query(
			'SELECT * FROM foods WHERE ("userId" = $1 OR "userId" IS NULL) AND "isDeleted" = FALSE ORDER BY "isSystemProperty" DESC, "name" ASC',
			[userId]
		);
		return result.rows as Food[];
	}

	async getSystemFoods(): Promise<Food[]> {
		const result = await this.client.query(
			'SELECT * FROM foods WHERE "isSystemProperty" = TRUE AND "isDeleted" = FALSE ORDER BY "name" ASC'
		);
		return result.rows as Food[];
	}

	/**
	 * returns a system food by ID, or null if not found
	 * @param foodId - the UUID of the food
	 * @returns the food or null
	 */
	async getSystemFoodById(foodId: string): Promise<Food | null> {
		const result = await this.client.query(
			'SELECT * FROM foods WHERE "id" = $1 AND "isSystemProperty" = TRUE AND "isDeleted" = FALSE',
			[foodId]
		);
		return (result.rows[0] as Food) ?? null;
	}

	/**
	 * returns all meal entries for a user on a specific date
	 * @param userId - the UUID of the user
	 * @param date - the entry date as Unix timestamp (ms)
	 * @returns list of meal entries ordered by creation time
	 */
	async getMealEntriesByDate(userId: string, date: number): Promise<MealEntry[]> {
		const result = await this.client.query(
			'SELECT * FROM meal_entries WHERE "userId" = $1 AND "entryDate" = $2 AND "isDeleted" = FALSE ORDER BY "createdAt" ASC',
			[userId, date]
		);
		return result.rows as MealEntry[];
	}

	/**
	 * returns foods for a meal entry joined with nutritional data.
	 * per-entry macro overrides on meal_entry_foods take precedence over the linked food row (COALESCE).
	 * soft-deleted foods are excluded.
	 * @param mealEntryId - the UUID of the meal entry
	 * @returns list of meal entry foods with joined food data
	 * SQL statement created with AI
	 */
	async getMealEntryFoodsWithNutrition(mealEntryId: string): Promise<MealEntryFoodWithNutrition[]> {
		const result = await this.client.query(
			`SELECT
				mef."id",
				mef."mealEntryId",
				mef."foodId",
				mef."quantityGrams",
				f."id"                                              AS "food_id",
				f."userId"                                          AS "food_userId",
				f."name"                                            AS "food_name",
				COALESCE(mef."caloriesPer100g", f."caloriesPer100g") AS "food_caloriesPer100g",
				COALESCE(mef."proteinPer100g",  f."proteinPer100g")  AS "food_proteinPer100g",
				COALESCE(mef."fatPer100g",      f."fatPer100g")      AS "food_fatPer100g",
				COALESCE(mef."carbsPer100g",    f."carbsPer100g")    AS "food_carbsPer100g",
				f."isSystemProperty"                                AS "food_isSystemProperty",
				f."isDeleted"                                       AS "food_isDeleted"
			FROM meal_entry_foods mef
			JOIN foods f ON f."id" = mef."foodId" AND f."isDeleted" = FALSE
			WHERE mef."mealEntryId" = $1`,
			[mealEntryId]
		);
		return result.rows.map(row => ({
			id: row.id as string,
			mealEntryId: row.mealEntryId as string,
			foodId: row.foodId as string,
			quantityGrams: row.quantityGrams as number,
			food: {
				id: row.food_id as string,
				userId: row.food_userId as string | null,
				name: row.food_name as string,
				caloriesPer100g: row.food_caloriesPer100g as number | null,
				proteinPer100g: row.food_proteinPer100g as number | null,
				fatPer100g: row.food_fatPer100g as number | null,
				carbsPer100g: row.food_carbsPer100g as number | null,
				isSystemProperty: row.food_isSystemProperty as boolean,
				isDeleted: row.food_isDeleted as boolean
			}
		})) as MealEntryFoodWithNutrition[];
	}

	/**
	 * returns a single food by ID if it belongs to the user or is a system food
	 * @param foodId - the UUID of the food
	 * @param userId - the UUID of the requesting user
	 * @returns the food or null if not found
	 */
	async getFoodById(foodId: string, userId: string): Promise<Food | null> {
		const result = await this.client.query(
			'SELECT * FROM foods WHERE "id" = $1 AND ("userId" = $2 OR "userId" IS NULL) AND "isDeleted" = FALSE',
			[foodId, userId]
		);
		return (result.rows[0] as Food) ?? null;
	}

	/**
	 * returns a single meal entry by ID if it belongs to the user
	 * @param entryId - the UUID of the meal entry
	 * @param userId - the UUID of the requesting user
	 * @returns the meal entry or null if not found
	 */
	async getMealEntryById(entryId: string, userId: string): Promise<MealEntry | null> {
		const result = await this.client.query(
			'SELECT * FROM meal_entries WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE',
			[entryId, userId]
		);
		return (result.rows[0] as MealEntry) ?? null;
	}

	/**
	 * updates editable fields of a meal entry (only provided fields are changed)
	 * @param entryId - the UUID of the meal entry
	 * @param fields - partial set of updatable entry fields
	 */
	async updateMealEntry(
		entryId: string,
		fields: { entryDate?: number; mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' }
	): Promise<void> {
		const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return;

		// build SET clause from provided fields only; id is the last positional param
		const setClauses = entries.map(([key], i) => `"${key}" = $${i + 1}`).join(', ');
		const values: unknown[] = entries.map(([, v]) => v);
		values.push(entryId);

		await this.client.query(`UPDATE meal_entries SET ${setClauses} WHERE "id" = $${values.length}`, values);
	}

	/**
	 * sets isDeleted = true without removing the row
	 * @param entryId - the UUID of the meal entry
	 */
	async softDeleteMealEntry(entryId: string): Promise<void> {
		await this.client.query('UPDATE meal_entries SET "isDeleted" = TRUE WHERE "id" = $1', [entryId]);
	}

	/**
	 * updates editable fields of a food (only provided fields are changed)
	 * @param foodId - the UUID of the food
	 * @param fields - partial set of updatable food fields
	 */
	async updateFood(
		foodId: string,
		fields: {
			name?: string;
			caloriesPer100g?: number | null;
			proteinPer100g?: number | null;
			fatPer100g?: number | null;
			carbsPer100g?: number | null;
		}
	): Promise<void> {
		const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return;

		const setClauses = entries.map(([key], i) => `"${key}" = $${i + 1}`).join(', ');
		const values = entries.map(([, v]) => v);
		values.push(foodId);

		await this.client.query(`UPDATE foods SET ${setClauses} WHERE "id" = $${values.length}`, values);
	}

	/**
	 * sets isDeleted = true without removing the row
	 * @param foodId - the UUID of the food
	 */
	async softDeleteFood(foodId: string): Promise<void> {
		await this.client.query('UPDATE foods SET "isDeleted" = TRUE WHERE "id" = $1', [foodId]);
	}

	/**
	 * creates a new food entry
	 * @param food - the food object to insert
	 * @returns the id of the created food
	 */
	async createFood(food: Food): Promise<string> {
		await this.client.query(
			`INSERT INTO foods ("id", "userId", "name", "caloriesPer100g", "proteinPer100g", "fatPer100g", "carbsPer100g", "isSystemProperty", "isDeleted")
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			[
				food.id,
				food.userId,
				food.name,
				food.caloriesPer100g,
				food.proteinPer100g,
				food.fatPer100g,
				food.carbsPer100g,
				food.isSystemProperty,
				food.isDeleted
			]
		);
		return food.id;
	}

	/**
	 * creates a new meal entry
	 * @param entry - the meal entry object to insert
	 * @returns the id of the created meal entry
	 */
	async createMealEntry(entry: MealEntry): Promise<string> {
		await this.client.query(
			`INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted")
			VALUES ($1, $2, $3, $4, $5, $6)`,
			[entry.id, entry.userId, entry.entryDate, entry.mealType, entry.createdAt, entry.isDeleted]
		);
		return entry.id;
	}

	/**
	 * returns a meal_entry_food item by ID, or null if not found
	 * @param itemId - the UUID of the item
	 * @returns the item or null
	 */
	async getMealEntryFoodById(itemId: string): Promise<MealEntryFood | null> {
		const result = await this.client.query('SELECT * FROM meal_entry_foods WHERE "id" = $1', [itemId]);
		return (result.rows[0] as MealEntryFood) ?? null;
	}

	/**
	 * hard-deletes a meal_entry_food record
	 * @param itemId - the UUID of the record to delete
	 */
	async deleteMealEntryFood(itemId: string): Promise<void> {
		await this.client.query('DELETE FROM meal_entry_foods WHERE "id" = $1', [itemId]);
	}

	/**
	 * updates the quantity of a meal_entry_food item
	 * @param itemId - the UUID of the item
	 * @param quantityGrams - the new quantity in grams
	 */
	async updateMealEntryFoodQuantity(itemId: string, quantityGrams: number): Promise<void> {
		await this.client.query('UPDATE meal_entry_foods SET "quantityGrams" = $1 WHERE "id" = $2', [
			quantityGrams,
			itemId
		]);
	}

	/**
	 * stores per-entry macro overrides on a meal_entry_food row.
	 * only provided fields are updated; null clears a previously set override.
	 * @param itemId - the UUID of the meal_entry_food record
	 * @param macros - partial set of macro override values
	 */
	async updateMealEntryFoodMacros(
		itemId: string,
		macros: {
			caloriesPer100g?: number | null;
			proteinPer100g?: number | null;
			fatPer100g?: number | null;
			carbsPer100g?: number | null;
		}
	): Promise<void> {
		const entries = Object.entries(macros).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return;

		const setClauses = entries.map(([key], i) => `"${key}" = $${i + 1}`).join(', ');
		const values: unknown[] = entries.map(([, v]) => v);
		values.push(itemId);

		await this.client.query(`UPDATE meal_entry_foods SET ${setClauses} WHERE "id" = $${values.length}`, values);
	}

	/**
	 * returns per-day nutrition totals within a date range (inclusive)
	 * days with entries but no foods appear with zero totals
	 * @param userId - the UUID of the user
	 * @param from - range start as Unix timestamp ms
	 * @param to - range end as Unix timestamp ms
	 * @returns array of daily totals ordered by date ascending
	 * SQL statement created with AI
	 */
	async getNutritionBreakdown(
		userId: string,
		from: number,
		to: number
	): Promise<
		{ entryDate: number; totalCalories: number; totalProtein: number; totalFat: number; totalCarbs: number }[]
	> {
		const result = await this.client.query(
			`SELECT
				me."entryDate",
				COALESCE(SUM(COALESCE(mef."caloriesPer100g", f."caloriesPer100g", 0) * mef."quantityGrams" / 100.0), 0)::integer AS "totalCalories",
				COALESCE(SUM(COALESCE(mef."proteinPer100g",  f."proteinPer100g",  0) * mef."quantityGrams" / 100.0), 0)::integer AS "totalProtein",
				COALESCE(SUM(COALESCE(mef."fatPer100g",      f."fatPer100g",      0) * mef."quantityGrams" / 100.0), 0)::integer AS "totalFat",
				COALESCE(SUM(COALESCE(mef."carbsPer100g",    f."carbsPer100g",    0) * mef."quantityGrams" / 100.0), 0)::integer AS "totalCarbs"
			FROM meal_entries me
			LEFT JOIN meal_entry_foods mef ON mef."mealEntryId" = me."id"
			LEFT JOIN foods f ON f."id" = mef."foodId" AND f."isDeleted" = FALSE
			WHERE me."userId" = $1
				AND me."isDeleted" = FALSE
				AND me."entryDate" >= $2
				AND me."entryDate" <= $3
			GROUP BY me."entryDate"
			ORDER BY me."entryDate" ASC`,
			[userId, from, to]
		);
		return result.rows.map(row => ({
			entryDate: Number(row.entryDate),
			totalCalories: row.totalCalories as number,
			totalProtein: row.totalProtein as number,
			totalFat: row.totalFat as number,
			totalCarbs: row.totalCarbs as number
		}));
	}

	/**
	 * inserts a new meal_entry_food junction record
	 * @param mealEntryFood - the junction record to insert
	 */
	async addFoodToMealEntry(mealEntryFood: MealEntryFood): Promise<void> {
		await this.client.query(
			`INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams")
			VALUES ($1, $2, $3, $4)`,
			[mealEntryFood.id, mealEntryFood.mealEntryId, mealEntryFood.foodId, mealEntryFood.quantityGrams]
		);
	}

	/**
	 * seeds system foods if the table is empty; subsequent calls are no-ops
	 * all foods created with AI
	 */
	async seedSystemFoodsIfEmpty(): Promise<void> {
		const existing = await this.client.query('SELECT 1 FROM foods WHERE "isSystemProperty" = TRUE LIMIT 1');
		if (existing.rows.length > 0) return;

		const systemFoods = [
			{ name: 'Reis (gekocht)', caloriesPer100g: 130, proteinPer100g: 3, fatPer100g: 0, carbsPer100g: 28 },
			{
				name: 'Hähnchenbrust (gegart)',
				caloriesPer100g: 165,
				proteinPer100g: 31,
				fatPer100g: 4,
				carbsPer100g: 0
			},
			{ name: 'Ei', caloriesPer100g: 155, proteinPer100g: 13, fatPer100g: 11, carbsPer100g: 1 },
			{ name: 'Apfel', caloriesPer100g: 52, proteinPer100g: 0, fatPer100g: 0, carbsPer100g: 14 },
			{ name: 'Banane', caloriesPer100g: 89, proteinPer100g: 1, fatPer100g: 0, carbsPer100g: 23 },
			{ name: 'Haferflocken', caloriesPer100g: 389, proteinPer100g: 17, fatPer100g: 7, carbsPer100g: 66 },
			{ name: 'Vollmilch (3,5%)', caloriesPer100g: 64, proteinPer100g: 3, fatPer100g: 4, carbsPer100g: 5 },
			{ name: 'Nudeln (gekocht)', caloriesPer100g: 131, proteinPer100g: 5, fatPer100g: 1, carbsPer100g: 25 },
			{ name: 'Vollkornbrot', caloriesPer100g: 241, proteinPer100g: 9, fatPer100g: 2, carbsPer100g: 44 },
			{ name: 'Magerquark', caloriesPer100g: 67, proteinPer100g: 12, fatPer100g: 0, carbsPer100g: 4 },
			{ name: 'Naturjoghurt', caloriesPer100g: 61, proteinPer100g: 4, fatPer100g: 3, carbsPer100g: 5 },
			{ name: 'Griechischer Joghurt', caloriesPer100g: 97, proteinPer100g: 9, fatPer100g: 5, carbsPer100g: 4 },
			{ name: 'Kartoffeln (gekocht)', caloriesPer100g: 77, proteinPer100g: 2, fatPer100g: 0, carbsPer100g: 17 },
			{ name: 'Lachs', caloriesPer100g: 208, proteinPer100g: 20, fatPer100g: 13, carbsPer100g: 0 },
			{ name: 'Thunfisch (Dose)', caloriesPer100g: 116, proteinPer100g: 26, fatPer100g: 1, carbsPer100g: 0 },
			{ name: 'Rinderhackfleisch', caloriesPer100g: 215, proteinPer100g: 17, fatPer100g: 16, carbsPer100g: 0 },
			{ name: 'Tomate', caloriesPer100g: 18, proteinPer100g: 1, fatPer100g: 0, carbsPer100g: 4 },
			{ name: 'Karotte', caloriesPer100g: 41, proteinPer100g: 1, fatPer100g: 0, carbsPer100g: 10 },
			{ name: 'Brokkoli', caloriesPer100g: 34, proteinPer100g: 3, fatPer100g: 0, carbsPer100g: 7 },
			{ name: 'Spinat', caloriesPer100g: 23, proteinPer100g: 3, fatPer100g: 0, carbsPer100g: 4 },
			{ name: 'Mandeln', caloriesPer100g: 579, proteinPer100g: 21, fatPer100g: 50, carbsPer100g: 22 },
			{ name: 'Olivenöl', caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbsPer100g: 0 },
			{ name: 'Orange', caloriesPer100g: 47, proteinPer100g: 1, fatPer100g: 0, carbsPer100g: 12 },
			{ name: 'Erdbeeren', caloriesPer100g: 32, proteinPer100g: 1, fatPer100g: 0, carbsPer100g: 8 },
			{ name: 'Kidneybohnen (gekocht)', caloriesPer100g: 127, proteinPer100g: 9, fatPer100g: 0, carbsPer100g: 22 }
		];

		for (const data of systemFoods) {
			await this.createFood({
				id: uuidv4(),
				userId: null,
				name: data.name,
				caloriesPer100g: data.caloriesPer100g,
				proteinPer100g: data.proteinPer100g,
				fatPer100g: data.fatPer100g,
				carbsPer100g: data.carbsPer100g,
				isSystemProperty: true,
				isDeleted: false
			});
		}
	}
}
