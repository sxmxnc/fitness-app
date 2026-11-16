/**
 * Autor: Simon Josef Cebula

 */

export class FoodNotFoundError extends Error {
	constructor() {
		super('Food not found');
	}
}

export class MealEntryNotFoundError extends Error {
	constructor() {
		super('Meal entry not found');
	}
}

export class MealEntryFoodNotFoundError extends Error {
	constructor() {
		super('Meal entry food not found');
	}
}

export class FoodNotOwnedError extends Error {
	constructor() {
		super('Cannot modify a food you do not own');
	}
}

export class SystemFoodError extends Error {
	constructor() {
		super('Cannot modify a system food');
	}
}

export class FoodMacroError extends Error {
	constructor(sum: number) {
		super(`Macros exceed 100g per 100g food weight (${sum}g total)`);
	}
}
