/**
 * Autor: Simon Josef Cebula

 */

export type Food = {
	id: string;
	userId: string | null;
	name: string;
	caloriesPer100g: number | null;
	proteinPer100g: number | null;
	fatPer100g: number | null;
	carbsPer100g: number | null;
	isSystemProperty: boolean;
	isDeleted: boolean;
};

export type MealEntry = {
	id: string;
	userId: string;
	entryDate: number;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

export type MealEntryFoodWithNutrition = {
	id: string;
	mealEntryId: string;
	foodId: string;
	quantityGrams: number;
	food: Food;
};

export type SummaryData = {
	period: 'daily' | 'weekly' | 'monthly' | 'yearly';
	from: number;
	to: number;
	totalCalories: number;
	totalProtein: number;
	totalFat: number;
	totalCarbs: number;
	breakdown: { date: number; calories: number; protein: number; fat: number; carbs: number }[];
};

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
	breakfast: 'Frühstück',
	lunch: 'Mittagessen',
	dinner: 'Abendessen',
	snack: 'Snack'
};

export const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
	daily: 'Heute',
	weekly: 'Woche',
	monthly: 'Monat',
	yearly: 'Jahr'
};

export const SUMMARY_TITLES: Record<Period, string> = {
	daily: 'TÄGLICHE KALORIEN',
	weekly: 'WÖCHENTLICHE KALORIEN',
	monthly: 'MONATLICHE KALORIEN',
	yearly: 'JÄHRLICHE KALORIEN'
};

// derived flags included so the parent does not re-compute them from raw values
export interface NewFoodFormData {
	name: string;
	calories: number;
	caloriesEmpty: boolean; // true when the input string is empty, distinct from calories === 0
	protein: number;
	fat: number;
	carbs: number;
	macroOverLimit: boolean;
	hasNegativeNutrition: boolean;
}

export interface PendingFoodItem {
	mode: 'existing' | 'new';
	displayName: string;
	quantityGrams: number;
	foodId?: string;
	caloriesPer100g?: number;
	proteinPer100g?: number;
	fatPer100g?: number;
	carbsPer100g?: number;
}

export function getTodayMs(): number {
	const d = new Date();
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
