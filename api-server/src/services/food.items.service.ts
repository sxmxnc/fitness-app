/**
 * Autor: Simon Josef Cebula

 */

import { v4 as uuidv4 } from 'uuid';

const STATS_WINDOW_DAYS = 30;
import { FoodDao } from '../dao/food.dao.js';
import { Food } from '../models/food_entitys/food.js';
import { FoodNotFoundError, SystemFoodError } from './food.errors.js';
import { assertMacrosWithinLimit } from './food.macros.js';

export class FoodItemsService {
	constructor(private readonly foodDao: FoodDao) {}

	async getAllFoods(userId: string): Promise<Food[]> {
		return this.foodDao.getAllFoods(userId);
	}

	async getSystemFoods(): Promise<Food[]> {
		return this.foodDao.getSystemFoods();
	}

	/**
	 * creates a globally visible system food.
	 * @throws FoodMacroError if macros exceed 100g/100g
	 */
	async adminCreateSystemFood(data: {
		name: string;
		caloriesPer100g?: number | null;
		proteinPer100g?: number | null;
		fatPer100g?: number | null;
		carbsPer100g?: number | null;
	}): Promise<Food> {
		assertMacrosWithinLimit(data);
		const food: Food = {
			id: uuidv4(),
			userId: null,
			name: data.name,
			caloriesPer100g: data.caloriesPer100g ?? null,
			proteinPer100g: data.proteinPer100g ?? null,
			fatPer100g: data.fatPer100g ?? null,
			carbsPer100g: data.carbsPer100g ?? null,
			isSystemProperty: true,
			isDeleted: false
		};
		const id = await this.foodDao.createFood(food);
		const created = await this.foodDao.getSystemFoodById(id);
		if (!created) throw new Error(`System food ${id} not found after insert`);
		return created;
	}

	/**
	 * updates a system food as an admin, bypassing the system-food protection.
	 * @throws FoodNotFoundError if the food does not exist or is not a system food
	 * @throws FoodMacroError if the resulting macros exceed 100g per 100g
	 */
	async adminUpdateSystemFood(
		foodId: string,
		data: {
			name?: string;
			caloriesPer100g?: number | null;
			proteinPer100g?: number | null;
			fatPer100g?: number | null;
			carbsPer100g?: number | null;
		}
	): Promise<Food> {
		const food = await this.foodDao.getSystemFoodById(foodId);
		if (!food) throw new FoodNotFoundError();
		assertMacrosWithinLimit(food, data);
		await this.foodDao.updateFood(foodId, data);
		const updated = await this.foodDao.getSystemFoodById(foodId);
		if (!updated) throw new Error(`System food ${foodId} not found after update`);
		return updated;
	}

	/**
	 * 30-day food stats for a user (calories, protein, fat, carbs, tracked days).
	 */
	async getAdminFoodStats(userId: string): Promise<{
		avgCalories: number | null;
		avgProtein: number | null;
		avgFat: number | null;
		avgCarbs: number | null;
		trackedDays: number;
	}> {
		const to = new Date();
		to.setHours(0, 0, 0, 0);
		const from = new Date(to);
		from.setDate(to.getDate() - (STATS_WINDOW_DAYS - 1));
		const rows = await this.foodDao.getNutritionBreakdown(userId, from.getTime(), to.getTime());
		const trackedDays = rows.length;
		if (trackedDays === 0) {
			return { avgCalories: null, avgProtein: null, avgFat: null, avgCarbs: null, trackedDays: 0 };
		}
		const totals = rows.reduce(
			(acc, r) => ({
				calories: acc.calories + r.totalCalories,
				protein: acc.protein + r.totalProtein,
				fat: acc.fat + r.totalFat,
				carbs: acc.carbs + r.totalCarbs
			}),
			{ calories: 0, protein: 0, fat: 0, carbs: 0 }
		);
		return {
			avgCalories: Math.round(totals.calories / trackedDays),
			avgProtein: Math.round(totals.protein / trackedDays),
			avgFat: Math.round(totals.fat / trackedDays),
			avgCarbs: Math.round(totals.carbs / trackedDays),
			trackedDays
		};
	}

	async getSystemFoodById(foodId: string): Promise<Food | null> {
		return this.foodDao.getSystemFoodById(foodId);
	}

	/**
	 * soft-deletes a system food as an admin, bypassing the system-food protection.
	 * @throws FoodNotFoundError if the food does not exist or is not a system food
	 */
	async adminDeleteSystemFood(foodId: string): Promise<void> {
		const food = await this.foodDao.getSystemFoodById(foodId);
		if (!food) throw new FoodNotFoundError();
		await this.foodDao.softDeleteFood(foodId);
	}

	/**
	 * returns a single food by ID, accessible to the given user.
	 * @throws FoodNotFoundError if the food does not exist or does not belong to the user
	 */
	async getFoodById(foodId: string, userId: string): Promise<Food> {
		const food = await this.foodDao.getFoodById(foodId, userId);
		if (!food) throw new FoodNotFoundError();
		return food;
	}

	/**
	 * updates editable fields of a food and returns the updated record.
	 * @throws FoodNotFoundError if the food does not exist or does not belong to the user
	 * @throws SystemFoodError if the food is a system food
	 * @throws FoodMacroError if the resulting macros exceed 100g per 100g
	 */
	async updateFood(
		foodId: string,
		userId: string,
		data: {
			name?: string;
			caloriesPer100g?: number | null;
			proteinPer100g?: number | null;
			fatPer100g?: number | null;
			carbsPer100g?: number | null;
		}
	): Promise<Food> {
		const food = await this.getFoodById(foodId, userId);
		if (food.isSystemProperty) throw new SystemFoodError();
		assertMacrosWithinLimit(food, data);
		await this.foodDao.updateFood(foodId, data);
		return this.getFoodById(foodId, userId);
	}

	/**
	 * soft-deletes a food after verifying it belongs to the user.
	 * @throws FoodNotFoundError if the food does not exist or does not belong to the user
	 * @throws SystemFoodError if the food is a system food
	 */
	async softDeleteFood(foodId: string, userId: string): Promise<void> {
		const food = await this.getFoodById(foodId, userId);
		if (food.isSystemProperty) throw new SystemFoodError();
		await this.foodDao.softDeleteFood(foodId);
	}

	/**
	 * @throws FoodMacroError if macros exceed 100g/100g
	 * @returns UUID of the created food
	 */
	async createFood(
		userId: string,
		data: {
			name: string;
			caloriesPer100g?: number;
			proteinPer100g?: number;
			fatPer100g?: number;
			carbsPer100g?: number;
		}
	): Promise<string> {
		assertMacrosWithinLimit(data);
		const food: Food = {
			id: uuidv4(),
			userId,
			name: data.name,
			caloriesPer100g: data.caloriesPer100g ?? null,
			proteinPer100g: data.proteinPer100g ?? null,
			fatPer100g: data.fatPer100g ?? null,
			carbsPer100g: data.carbsPer100g ?? null,
			isSystemProperty: false,
			isDeleted: false
		};
		return this.foodDao.createFood(food);
	}
}
