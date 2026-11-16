/**
 * Autor: Simon Josef Cebula

 */

import express from 'express';
import { z } from 'zod';
import { FoodService } from '../services/food.service.js';
import { FoodNotFoundError, SystemFoodError, FoodMacroError } from '../services/food.errors.js';
import { rfcErros } from '../errors/rfc-error.js';
import { requireOwnerOrAdmin, asyncHandler } from '../middleware/auth.js';
import { uuidV4Schema, validationDetail } from '../utils/validation.util.js';

export const foodItemsRouter = express.Router();

const idParamSchema = z.object({ id: uuidV4Schema });
const foodParamSchema = z.object({ id: uuidV4Schema, foodId: uuidV4Schema });

const createFoodSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	caloriesPer100g: z.number().min(0).optional(),
	proteinPer100g: z.number().min(0).optional(),
	fatPer100g: z.number().min(0).optional(),
	carbsPer100g: z.number().min(0).optional()
});

const updateFoodSchema = z.object({
	name: z.string().min(1, 'Name must not be empty').optional(),
	caloriesPer100g: z.number().min(0).nullable().optional(),
	proteinPer100g: z.number().min(0).nullable().optional(),
	fatPer100g: z.number().min(0).nullable().optional(),
	carbsPer100g: z.number().min(0).nullable().optional()
});

/**
 * GET /api/food/:id/foods
 * returns all foods available to the user (system foods + own foods)
 * @param id - UUID v4 of the user
 * @returns list of foods or 400 if id is invalid
 */
foodItemsRouter.get(
	'/:id/foods',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const foods = await foodService.items.getAllFoods(params.data.id);
		res.json(foods);
	})
);

/**
 * GET /api/food/:id/foods/:foodId
 * returns a single food by ID for the given user
 * @param id - UUID v4 of the user
 * @param foodId - UUID v4 of the food
 * @returns the food or 404 if not found
 */
foodItemsRouter.get(
	'/:id/foods/:foodId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = foodParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		try {
			const food = await foodService.items.getFoodById(params.data.foodId, params.data.id);
			res.json(food);
		} catch (e) {
			if (e instanceof FoodNotFoundError) {
				res.status(404).json(rfcErros.notFound('Food not found').toJSON());
				return;
			}
			throw e;
		}
	})
);

/**
 * POST /api/food/:id/foods
 * creates a new user-specific food
 * @param id - UUID v4 of the user
 * @body name (required), caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g (optional)
 * @returns 201 with the id of the created food, or 400 if validation fails
 */
foodItemsRouter.post(
	'/:id/foods',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = createFoodSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const foodId = await foodService.items.createFood(params.data.id, result.data);
			res.status(201).json({ id: foodId });
		} catch (e) {
			if (e instanceof FoodMacroError) {
				res.status(400).json(rfcErros.badRequest((e as Error).message).toJSON());
				return;
			}
			throw e;
		}
	})
);

/**
 * PATCH /api/food/:id/foods/:foodId
 * updates editable fields of a food
 * @param id - UUID v4 of the user
 * @param foodId - UUID v4 of the food
 * @body partial food fields (name, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g)
 * @returns updated food or 404 if not found
 */
foodItemsRouter.patch(
	'/:id/foods/:foodId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = foodParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = updateFoodSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const updated = await foodService.items.updateFood(params.data.foodId, params.data.id, result.data);
			res.json(updated);
		} catch (e) {
			if (e instanceof FoodNotFoundError) {
				res.status(404).json(rfcErros.notFound('Food not found').toJSON());
				return;
			}
			if (e instanceof SystemFoodError) {
				res.status(403).json(rfcErros.forbidden('Cannot modify a system food').toJSON());
				return;
			}
			if (e instanceof FoodMacroError) {
				res.status(400).json(rfcErros.badRequest((e as Error).message).toJSON());
				return;
			}
			throw e;
		}
	})
);

/**
 * DELETE /api/food/:id/foods/:foodId
 * soft-deletes a food belonging to the user
 * @param id - UUID v4 of the user
 * @param foodId - UUID v4 of the food
 * @returns 204 on success or 404 if not found
 */
foodItemsRouter.delete(
	'/:id/foods/:foodId',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = foodParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		try {
			await foodService.items.softDeleteFood(params.data.foodId, params.data.id);
			res.status(204).send();
		} catch (e) {
			if (e instanceof FoodNotFoundError) {
				res.status(404).json(rfcErros.notFound('Food not found').toJSON());
				return;
			}
			if (e instanceof SystemFoodError) {
				res.status(403).json(rfcErros.forbidden('Cannot delete a system food').toJSON());
				return;
			}
			throw e;
		}
	})
);
