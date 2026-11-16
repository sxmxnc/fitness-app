/**
 * Autor: Simon Josef Cebula

 */

import express from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';
import { FoodService } from '../services/food.service.js';
import { FoodNotFoundError, FoodMacroError } from '../services/food.errors.js';
import { rfcErros } from '../errors/rfc-error.js';
import { validationDetail } from '../utils/validation.util.js';

export const adminFoodRouter = express.Router();

const adminCreateFoodSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	caloriesPer100g: z.number().min(0).nullable().optional(),
	proteinPer100g: z.number().min(0).nullable().optional(),
	fatPer100g: z.number().min(0).nullable().optional(),
	carbsPer100g: z.number().min(0).nullable().optional()
});

const adminUpdateFoodSchema = z.object({
	name: z.string().min(1, 'Name must not be empty').optional(),
	caloriesPer100g: z.number().min(0).nullable().optional(),
	proteinPer100g: z.number().min(0).nullable().optional(),
	fatPer100g: z.number().min(0).nullable().optional(),
	carbsPer100g: z.number().min(0).nullable().optional()
});

/**
 * GET /api/admin/foods
 * returns all system foods for admin management
 * @returns list of system foods or 401/403 if unauthorized
 */
adminFoodRouter.get(
	'/foods',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;
		const foods = await foodService.items.getSystemFoods();
		res.json(foods);
	})
);

/**
 * GET /api/admin/foods/:id
 * returns a single system food by ID
 * @param id - UUID of the system food
 * @returns the food or 404 if not found
 */
adminFoodRouter.get(
	'/foods/:id',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;
		const foodId = req.params.id as string;
		const food = await foodService.items.getSystemFoodById(foodId);
		if (!food) {
			res.status(404).json(rfcErros.notFound('System food not found').toJSON());
			return;
		}
		res.json(food);
	})
);

/**
 * POST /api/admin/foods
 * creates a new system food (isSystemProperty = true, userId = null)
 * @body name (required), caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g (optional)
 * @returns 201 with the created food or 400 if validation fails
 */
adminFoodRouter.post(
	'/foods',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const result = adminCreateFoodSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const created = await foodService.items.adminCreateSystemFood(result.data);
			res.status(201).json(created);
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
 * PATCH /api/admin/foods/:id
 * updates a system food as admin (bypasses system-food protection for regular users)
 * @param id - UUID of the system food to update
 * @body partial food fields (name, caloriesPer100g, proteinPer100g, fatPer100g, carbsPer100g)
 * @returns updated food or 404 if not found
 */
adminFoodRouter.patch(
	'/foods/:id',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;
		const foodId = req.params.id as string;

		const result = adminUpdateFoodSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		try {
			const updated = await foodService.items.adminUpdateSystemFood(foodId, result.data);
			res.json(updated);
		} catch (e) {
			if (e instanceof FoodNotFoundError) {
				res.status(404).json(rfcErros.notFound('System food not found').toJSON());
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
 * DELETE /api/admin/foods/:id
 * soft-deletes a system food as admin
 * @param id - UUID of the system food to delete
 * @returns 204 on success or 404 if not found
 */
adminFoodRouter.delete(
	'/foods/:id',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;
		const foodId = req.params.id as string;
		try {
			await foodService.items.adminDeleteSystemFood(foodId);
			res.status(204).send();
		} catch (e) {
			if (e instanceof FoodNotFoundError) {
				res.status(404).json(rfcErros.notFound('System food not found').toJSON());
				return;
			}
			throw e;
		}
	})
);
