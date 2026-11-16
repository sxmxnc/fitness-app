/**
 * Autor: Simon Josef Cebula

 */

import { FoodMacroError } from './food.errors.js';

type Macros = {
	proteinPer100g?: number | null;
	fatPer100g?: number | null;
	carbsPer100g?: number | null;
};

/**
 * Ensures protein + fat + carbs never exceed 100g per 100g of food.
 * Values present in `update` override the matching `base` value; an undefined field keeps the base value.
 * Pass only `base` to validate a brand-new food (no existing values to merge against).
 * @throws FoodMacroError if the resulting sum exceeds 100
 */
export function assertMacrosWithinLimit(base: Macros, update: Macros = {}): void {
	const protein = update.proteinPer100g !== undefined ? update.proteinPer100g : base.proteinPer100g;
	const fat = update.fatPer100g !== undefined ? update.fatPer100g : base.fatPer100g;
	const carbs = update.carbsPer100g !== undefined ? update.carbsPer100g : base.carbsPer100g;
	const sum = (protein ?? 0) + (fat ?? 0) + (carbs ?? 0);
	if (sum > 100) throw new FoodMacroError(sum);
}
