/**
 * Autor: Simon Josef Cebula

 */

import express from 'express';
import { z } from 'zod';
import { FoodService } from '../services/food.service.js';
import { rfcErros } from '../errors/rfc-error.js';
import { requireOwnerOrAdmin, asyncHandler } from '../middleware/auth.js';
import { uuidV4Schema, validationDetail } from '../utils/validation.util.js';

export const summaryRouter = express.Router();

const idParamSchema = z.object({ id: uuidV4Schema });

const summaryQuerySchema = z
	.object({
		period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
		date: z.string().regex(/^\d+$/, 'date must be a valid Unix timestamp').transform(Number).optional(),
		year: z
			.string()
			.regex(/^\d{4}$/, 'year must be a 4-digit number')
			.transform(Number)
			.optional()
	})
	.refine(data => (data.period === 'yearly' ? data.year !== undefined : data.date !== undefined), {
		message: 'date is required for daily/weekly/monthly; year is required for yearly'
	});

/**
 * GET /api/food/:id/summary?period=<period>&date=<ms>|year=<yyyy>
 * returns aggregated nutrition data for the given period
 * @param id - UUID v4 of the user
 * @query period - daily | weekly | monthly | yearly
 * @query date - Unix timestamp ms (required for daily/weekly/monthly)
 * @query year - 4-digit year (required for yearly)
 * @returns totals and per-day breakdown
 */
summaryRouter.get(
	'/:id/summary',
	requireOwnerOrAdmin,
	asyncHandler(async (req, res) => {
		const foodService: FoodService = req.app.locals.foodService;

		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const result = summaryQuerySchema.safeParse(req.query);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		const summary = await foodService.summary.getSummary(
			params.data.id,
			result.data.period,
			result.data.date,
			result.data.year
		);
		res.json(summary);
	})
);
