/**
 * Autor: Simon Josef Cebula

 */

import { Food } from './food.js';

/** Describes the meal entry food shape. */
export type MealEntryFood = {
	id: string;
	mealEntryId: string;
	foodId: string;
	quantityGrams: number;
	/** per-entry macro overrides; when set, take precedence over the linked food row */
	caloriesPer100g?: number | null;
	proteinPer100g?: number | null;
	fatPer100g?: number | null;
	carbsPer100g?: number | null;
};

/** Describes the meal entry food with nutrition shape. */
export type MealEntryFoodWithNutrition = MealEntryFood & {
	food: Food;
};
