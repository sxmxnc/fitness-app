/**
 * Autor: Simon Josef Cebula

 */

import express from 'express';
import { z } from 'zod';
import { FoodService } from '../services/food.service.js';
import { rfcErros } from '../errors/rfc-error.js';
import { requireOwnerOrAdmin, asyncHandler } from '../middleware/auth.js';
import { uuidV4Schema, validationDetail } from '../utils/validation.util.js';
import { handleFoodError } from './food.error-handler.js';

export const entriesRouter = express.Router();

const idParamSchema = z.object({ id: uuidV4Schema });
const entryParamSchema = z.object({ id: uuidV4Schema, entryId: uuidV4Schema });
const itemParamSchema = z.object({ id: uuidV4Schema, entryId: uuidV4Schema, itemId: uuidV4Schema });

const createMealEntrySchema = z.object({
	entryDate: z.number().min(0, 'entryDate must be a valid Unix timestamp'),
	mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
});

const addFoodToEntrySchema = z.object({
	foodId: uuidV4Schema,
	quantityGrams: z.number().min(1, 'quantityGrams must be at least 1')
});

const updateMealEntrySchema = z
	.object({
		entryDate: z.number().min(0, 'entryDate must be a valid Unix timestamp').optional(),
		mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional()
	})
	.refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

const updateMealEntryItemSchema = z
	.object({
		quantityGrams: z.number().min(1, 'quantityGrams must be at least 1').optional(),
		caloriesPer100g: z.number().min(0).nullable().optional(),
		proteinPer100g: z.number().min(0).nullable().optional(),
		fatPer100g: z.number().min(0).nullable().optional(),
		carbsPer100g: z.number().min(0).nullable().optional()
	})
	.refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

const addCustomFoodToEntrySchema = z.object({
	name: z.string().min(1, 'Name is required'),
	quantityGrams: z.number().min(1, 'quantityGrams must be at least 1'),
	caloriesPer100g: z.number().min(0).optional(),
	proteinPer100g: z.number().min(0).optional(),
	fatPer100g: z.number().min(0).optional(),
	carbsPer100g: z.number().min(0).optional()
});

/**
 * GET /api/food/:id/entries?date=<ms>
 * returns all meal entries for a user on a specific date, each with its foods and nutritional data inline
 * @param id - UUID v4 of the user
 * @query date - the entry date as Unix timestamp (ms)
 * @returns list of meal entries with foods or 400 if parameters are invalid
 */
entriesRouter.get(
	'/:id/entries',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const date = Number(req.query.date);
		if (!req.query.date || isNaN(date)) {
			res.status(400).json(rfcErros.badRequest('Query parameter "date" must be a valid Unix timestamp').toJSON());
			return;
		}

		const entries = await foodService.entries.getMealEntriesByDate(params.data.id, date);
		const entriesWithFoods = await Promise.all(
			entries.map(async entry => ({
				...entry,
				foods: await foodService.entries.getMealEntryFoodsWithNutrition(entry.id)
			}))
		);
		res.json(entriesWithFoods);
	})
);

/**
 * GET /api/food/:id/entries/:entryId
 * returns a meal entry with all its foods and nutritional data
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @returns meal entry with foods or 404 if not found
 */
entriesRouter.get(
	'/:id/entries/:entryId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = entryParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		try {
			const entry = await foodService.entries.getMealEntryById(params.data.entryId, params.data.id);
			const foods = await foodService.entries.getMealEntryFoodsWithNutrition(params.data.entryId);
			res.json({ ...entry, foods });
		} catch (e) {
			if (!handleFoodError(e, res)) throw e;
		}
	})
);

/**
 * POST /api/food/:id/entries
 * creates a new meal entry for a user
 * @param id - UUID v4 of the user
 * @body entryDate (Unix ms), mealType (breakfast|lunch|dinner|snack)
 * @returns 201 with the id of the created meal entry, or 400 if validation fails
 */
entriesRouter.post(
	'/:id/entries',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = createMealEntrySchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		const entryId = await foodService.entries.createMealEntry(params.data.id, result.data);
		res.status(201).json({ id: entryId });
	})
);

/**
 * POST /api/food/:id/entries/:entryId/items
 * adds a food item to an existing meal entry
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @body foodId (UUID), quantityGrams (number >= 1)
 * @returns 201 with the id of the created item, or 400 if validation fails
 */
entriesRouter.post(
	'/:id/entries/:entryId/items',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = entryParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = addFoodToEntrySchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		const itemId = await foodService.entries.addFoodToMealEntry(
			params.data.entryId,
			result.data.foodId,
			result.data.quantityGrams
		);
		res.status(201).json({ id: itemId });
	})
);

/**
 * POST /api/food/:id/entries/:entryId/custom-food
 * creates a custom food and links it to the given meal entry
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @body name (required), quantityGrams (required), optional macros per 100g
 * @returns 201 with the id of the created meal_entry_food record
 */
entriesRouter.post(
	'/:id/entries/:entryId/custom-food',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = entryParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = addCustomFoodToEntrySchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const itemId = await foodService.entries.addCustomFoodToMealEntry(
				params.data.entryId,
				params.data.id,
				result.data
			);
			res.status(201).json({ id: itemId });
		} catch (e) {
			if (!handleFoodError(e, res)) throw e;
		}
	})
);

/**
 * PATCH /api/food/:id/entries/:entryId
 * updates mealType and/or entryDate of a meal entry
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @body entryDate (Unix ms), mealType (optional, at least one required)
 * @returns updated meal entry or 404 if not found
 */
entriesRouter.patch(
	'/:id/entries/:entryId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = entryParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = updateMealEntrySchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const updated = await foodService.entries.updateMealEntry(params.data.entryId, params.data.id, result.data);
			res.json(updated);
		} catch (e) {
			if (!handleFoodError(e, res)) throw e;
		}
	})
);

/**
 * PATCH /api/food/:id/entries/:entryId/items/:itemId
 * updates quantity and/or macros of a meal entry food item
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @param itemId - UUID v4 of the meal_entry_food record
 * @body quantityGrams, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g (at least one)
 * @returns updated item with nutrition or 404 if not found
 */
entriesRouter.patch(
	'/:id/entries/:entryId/items/:itemId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = itemParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = updateMealEntryItemSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const updated = await foodService.entries.updateMealEntryFoodEntry(
				params.data.itemId,
				params.data.entryId,
				params.data.id,
				result.data
			);
			res.json(updated);
		} catch (e) {
			if (!handleFoodError(e, res)) throw e;
		}
	})
);

/**
 * DELETE /api/food/:id/entries/:entryId
 * soft-deletes a meal entry belonging to the user
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @returns 204 on success or 404 if not found
 */
entriesRouter.delete(
	'/:id/entries/:entryId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = entryParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		try {
			await foodService.entries.softDeleteMealEntry(params.data.entryId, params.data.id);
			res.status(204).send();
		} catch (e) {
			if (!handleFoodError(e, res)) throw e;
		}
	})
);

/**
 * DELETE /api/food/:id/entries/:entryId/items/:itemId
 * removes a food item from a meal entry
 * @param id - UUID v4 of the user
 * @param entryId - UUID v4 of the meal entry
 * @param itemId - UUID v4 of the meal_entry_food record
 * @returns 204 on success or 404 if not found
 */
entriesRouter.delete(
	'/:id/entries/:entryId/items/:itemId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = itemParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		try {
			await foodService.entries.removeFoodFromMealEntry(params.data.itemId, params.data.entryId, params.data.id);
			res.status(204).send();
		} catch (e) {
			if (!handleFoodError(e, res)) throw e;
		}
	})
);
