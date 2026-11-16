/**
 * Autor: Simon Josef Cebula

 */

import { Response } from 'express';
import {
	MealEntryNotFoundError,
	MealEntryFoodNotFoundError,
	FoodNotOwnedError,
	FoodMacroError
} from '../services/food.errors.js';
import { rfcErros } from '../errors/rfc-error.js';

/**
 * maps known food domain errors to HTTP responses.
 * @param e - the caught error
 * @param res - the Express response object
 * @returns true if the error was handled, false if it should be re-thrown
 */
export function handleFoodError(e: unknown, res: Response): boolean {
	if (e instanceof MealEntryNotFoundError) {
		res.status(404).json(rfcErros.notFound('Meal entry not found').toJSON());
		return true;
	}
	if (e instanceof MealEntryFoodNotFoundError) {
		res.status(404).json(rfcErros.notFound('Meal entry food item not found').toJSON());
		return true;
	}
	if (e instanceof FoodNotOwnedError) {
		res.status(403).json(rfcErros.forbidden('Cannot modify macros of a food you do not own').toJSON());
		return true;
	}
	if (e instanceof FoodMacroError) {
		res.status(400).json(rfcErros.badRequest((e as Error).message).toJSON());
		return true;
	}
	return false;
}
