/**
 * Autor: Justus Heinz

 */
import express from 'express';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';
import { SystemDao } from '../dao/system.dao.js';
import { rfcErros } from '../errors/rfc-error.js';
import {
	nonEmptyTextSchema,
	optionalPositiveIntSchema,
	optionalTextSchema,
	positiveIntSchema,
	uuidV4Schema,
	validationDetail
} from '../utils/validation.util.js';
import { z } from 'zod';

export const adminWorkoutPlansRouter = express.Router();

const systemPlanSchema = z.object({
	name: nonEmptyTextSchema(120),
	description: optionalTextSchema(1000)
});

const planIdParamSchema = z.object({
	id: uuidV4Schema
});

const planExerciseParamSchema = z.object({
	planId: uuidV4Schema,
	peId: uuidV4Schema
});

const addExerciseSchema = z.object({
	exerciseId: uuidV4Schema,
	exerciseOrder: positiveIntSchema(500),
	targetSets: optionalPositiveIntSchema(100),
	targetReps: optionalPositiveIntSchema(1000),
	targetWeight: optionalPositiveIntSchema(2000),
	targetDurationMinutes: optionalPositiveIntSchema(1440)
});

/**
 * GET /api/admin/workout-plans
 * Returns all system workout plans with their exercises
 */
adminWorkoutPlansRouter.get(
	'/workout-plans',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: SystemDao = req.app.locals.systemDao;
		const plans = await dao.getAllSystemPlans();
		res.json(plans);
	})
);

/**
 * POST /api/admin/workout-plans
 * Creates a new system workout plan
 */
adminWorkoutPlansRouter.post(
	'/workout-plans',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: SystemDao = req.app.locals.systemDao;
		const result = systemPlanSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		const plan = await dao.adminCreateSystemPlan(result.data.name, result.data.description);
		res.status(201).json(plan);
	})
);

/**
 * DELETE /api/admin/workout-plans/:id
 * Soft-deletes a system workout plan
 */
adminWorkoutPlansRouter.delete(
	'/workout-plans/:id',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: SystemDao = req.app.locals.systemDao;
		const params = planIdParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const deleted = await dao.adminDeleteSystemPlan(params.data.id);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound('System workout plan not found').toJSON());
			return;
		}
		res.status(204).send();
	})
);

/**
 * POST /api/admin/workout-plans/:id/exercises
 * Adds an exercise to a system workout plan
 */
adminWorkoutPlansRouter.post(
	'/workout-plans/:id/exercises',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: SystemDao = req.app.locals.systemDao;
		const params = planIdParamSchema.safeParse(req.params);
		const body = addExerciseSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const { exerciseId, exerciseOrder, targetSets, targetReps, targetWeight, targetDurationMinutes } = body.data;
		const entry = await dao.addExerciseToSystemPlan(
			params.data.id,
			exerciseId,
			exerciseOrder,
			targetSets,
			targetReps,
			targetWeight,
			targetDurationMinutes
		);
		if (!entry) {
			res.status(404).json(rfcErros.notFound('System plan or system exercise not found').toJSON());
			return;
		}
		res.status(201).json(entry);
	})
);

/**
 * DELETE /api/admin/workout-plans/:planId/exercises/:peId
 * Removes an exercise entry from a system workout plan
 */
adminWorkoutPlansRouter.delete(
	'/workout-plans/:planId/exercises/:peId',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: SystemDao = req.app.locals.systemDao;
		const params = planExerciseParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const deleted = await dao.adminRemoveExerciseFromPlan(params.data.peId);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound('Plan exercise not found').toJSON());
			return;
		}
		res.status(204).send();
	})
);
