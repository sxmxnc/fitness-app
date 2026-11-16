/**
 * Autor: Simon Josef Cebula

 */

import { v4 as uuidv4 } from 'uuid';
import { FoodDao } from '../dao/food.dao.js';
import { MealEntry } from '../models/food_entitys/meal_entry.js';
import { MealEntryFood, MealEntryFoodWithNutrition } from '../models/food_entitys/meal_entry_food.js';
import { MealEntryNotFoundError, MealEntryFoodNotFoundError, FoodNotOwnedError } from './food.errors.js';
import { FoodItemsService } from './food.items.service.js';
import { assertMacrosWithinLimit } from './food.macros.js';

export class FoodEntriesService {
	constructor(
		private readonly foodDao: FoodDao,
		private readonly itemsService: FoodItemsService
	) {}

	async getMealEntriesByDate(userId: string, date: number): Promise<MealEntry[]> {
		return this.foodDao.getMealEntriesByDate(userId, date);
	}

	async getMealEntryFoodsWithNutrition(entryId: string): Promise<MealEntryFoodWithNutrition[]> {
		return this.foodDao.getMealEntryFoodsWithNutrition(entryId);
	}

	/**
	 * returns a single meal entry by ID for the given user.
	 * @throws MealEntryNotFoundError if the entry does not exist or does not belong to the user
	 */
	async getMealEntryById(entryId: string, userId: string): Promise<MealEntry> {
		const entry = await this.foodDao.getMealEntryById(entryId, userId);
		if (!entry) throw new MealEntryNotFoundError();
		return entry;
	}

	/**
	 * @returns UUID of the created meal entry
	 */
	async createMealEntry(
		userId: string,
		data: { entryDate: number; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' }
	): Promise<string> {
		const entry: MealEntry = {
			id: uuidv4(),
			userId,
			entryDate: data.entryDate,
			mealType: data.mealType,
			createdAt: Date.now(),
			isDeleted: false
		};
		return this.foodDao.createMealEntry(entry);
	}

	/**
	 * @returns UUID of the created item
	 */
	async addFoodToMealEntry(entryId: string, foodId: string, quantityGrams: number): Promise<string> {
		const item: MealEntryFood = {
			id: uuidv4(),
			mealEntryId: entryId,
			foodId,
			quantityGrams
		};
		await this.foodDao.addFoodToMealEntry(item);
		return item.id;
	}

	/**
	 * updates editable fields of a meal entry and returns the updated record.
	 * @throws MealEntryNotFoundError if the entry does not exist or does not belong to the user
	 */
	async updateMealEntry(
		entryId: string,
		userId: string,
		data: { entryDate?: number; mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' }
	): Promise<MealEntry> {
		await this.getMealEntryById(entryId, userId);
		await this.foodDao.updateMealEntry(entryId, data);
		return this.getMealEntryById(entryId, userId);
	}

	/**
	 * soft-deletes a meal entry after verifying it belongs to the user.
	 * @throws MealEntryNotFoundError if the entry does not exist or does not belong to the user
	 */
	async softDeleteMealEntry(entryId: string, userId: string): Promise<void> {
		await this.getMealEntryById(entryId, userId);
		await this.foodDao.softDeleteMealEntry(entryId);
	}

	/**
	 * removes a food item from a meal entry (hard delete).
	 * @throws MealEntryNotFoundError if the meal entry does not belong to the user
	 * @throws MealEntryFoodNotFoundError if the item does not exist or does not belong to the entry
	 */
	async removeFoodFromMealEntry(itemId: string, entryId: string, userId: string): Promise<void> {
		await this.getMealEntryById(entryId, userId);
		const item = await this.foodDao.getMealEntryFoodById(itemId);
		if (!item || item.mealEntryId !== entryId) throw new MealEntryFoodNotFoundError();
		await this.foodDao.deleteMealEntryFood(itemId);
	}

	/**
	 * updates quantity and/or macros of a meal entry food item.
	 * macro updates are only allowed when the linked food belongs to the requesting user.
	 * @throws MealEntryNotFoundError if the meal entry does not belong to the user
	 * @throws MealEntryFoodNotFoundError if the item does not exist or does not belong to the entry
	 * @throws FoodNotOwnedError if the user tries to update macros on a food they do not own
	 * @throws FoodMacroError if the resulting macros exceed 100g per 100g
	 */
	async updateMealEntryFoodEntry(
		itemId: string,
		entryId: string,
		userId: string,
		data: {
			quantityGrams?: number;
			caloriesPer100g?: number | null;
			proteinPer100g?: number | null;
			fatPer100g?: number | null;
			carbsPer100g?: number | null;
		}
	): Promise<MealEntryFoodWithNutrition> {
		await this.getMealEntryById(entryId, userId);
		const item = await this.foodDao.getMealEntryFoodById(itemId);
		if (!item || item.mealEntryId !== entryId) throw new MealEntryFoodNotFoundError();

		if (data.quantityGrams !== undefined) {
			await this.foodDao.updateMealEntryFoodQuantity(itemId, data.quantityGrams);
		}

		const macros = {
			caloriesPer100g: data.caloriesPer100g,
			proteinPer100g: data.proteinPer100g,
			fatPer100g: data.fatPer100g,
			carbsPer100g: data.carbsPer100g
		};
		const hasMacros = Object.values(macros).some(v => v !== undefined);
		if (hasMacros) {
			const food = await this.foodDao.getFoodById(item.foodId, userId);
			// system foods can't be macro-edited; only the food's owner can change them
			if (!food || food.userId !== userId) throw new FoodNotOwnedError();
			assertMacrosWithinLimit(food, macros);
			// store overrides on the entry row instead of mutating the shared food record
			await this.foodDao.updateMealEntryFoodMacros(itemId, macros);
		}

		const updatedItems = await this.foodDao.getMealEntryFoodsWithNutrition(entryId);
		const updatedItem = updatedItems.find(i => i.id === itemId);
		if (!updatedItem) throw new MealEntryFoodNotFoundError();
		return updatedItem;
	}

	/**
	 * creates a custom food and links it to the given meal entry.
	 * @throws MealEntryNotFoundError if the meal entry does not belong to the user
	 * @returns the UUID of the created meal_entry_food record
	 */
	async addCustomFoodToMealEntry(
		entryId: string,
		userId: string,
		data: {
			name: string;
			quantityGrams: number;
			caloriesPer100g?: number;
			proteinPer100g?: number;
			fatPer100g?: number;
			carbsPer100g?: number;
		}
	): Promise<string> {
		await this.getMealEntryById(entryId, userId);
		const foodId = await this.itemsService.createFood(userId, {
			name: data.name,
			caloriesPer100g: data.caloriesPer100g,
			proteinPer100g: data.proteinPer100g,
			fatPer100g: data.fatPer100g,
			carbsPer100g: data.carbsPer100g
		});
		return this.addFoodToMealEntry(entryId, foodId, data.quantityGrams);
	}
}
