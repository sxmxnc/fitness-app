/**
 * Autor: Justus Heinz

 */

import { Router } from 'express';
import { z } from 'zod';
import { WorkoutPlansDao } from '../dao/workout-plans.dao.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { rfcErros } from '../errors/rfc-error.js';
import {
	nonEmptyTextSchema,
	optionalPositiveIntSchema,
	optionalTextSchema,
	positiveIntSchema,
	uuidV4Schema,
	validationDetail
} from '../utils/validation.util.js';

export const workoutPlansRouter = Router();

workoutPlansRouter.use(requireAuth);

const idParamSchema = z.object({ id: uuidV4Schema });
const planExerciseParamSchema = z.object({ id: uuidV4Schema, planExerciseId: uuidV4Schema });

const createPlanSchema = z.object({
	name: nonEmptyTextSchema(120),
	description: optionalTextSchema(1000)
});

const updatePlanSchema = z
	.object({
		name: nonEmptyTextSchema(120).optional(),
		description: optionalTextSchema(1000)
	})
	.refine(data => data.name !== undefined || data.description !== undefined, {
		message: 'At least one field must be provided'
	});

const setPlanOrderSchema = z.object({
	planIds: z.array(uuidV4Schema).max(100)
});

const addExerciseSchema = z.object({
	exerciseId: uuidV4Schema,
	exerciseOrder: positiveIntSchema(500),
	targetSets: optionalPositiveIntSchema(100),
	targetReps: optionalPositiveIntSchema(1000),
	targetWeight: optionalPositiveIntSchema(2000),
	targetDurationMinutes: optionalPositiveIntSchema(1440)
});

const updateOrderSchema = z.object({
	order: z
		.array(z.object({ id: uuidV4Schema, exerciseOrder: positiveIntSchema(500) }))
		.min(1)
		.max(500)
});

// GET /api/workout-plans
workoutPlansRouter.get(
	'/',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const userId = res.locals.userId as string;
		const plans = await dao.getAllPlans(userId);
		res.status(200).json(plans);
	})
);

// POST /api/workout-plans
workoutPlansRouter.post(
	'/',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const body = createPlanSchema.safeParse(req.body);
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { name, description } = body.data;
		const plan = await dao.createPlan(userId, name, description);
		res.status(201).json(plan);
	})
);

// GET /api/workout-plans/order
workoutPlansRouter.get(
	'/order',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const userId = res.locals.userId as string;
		const order = await dao.getUserPlanOrder(userId);
		res.status(200).json(order);
	})
);

// PUT /api/workout-plans/order
workoutPlansRouter.put(
	'/order',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const body = setPlanOrderSchema.safeParse(req.body);
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		await dao.setUserPlanOrder(userId, body.data.planIds);
		res.status(200).json({ ok: true });
	})
);

// PUT /api/workout-plans/:id
workoutPlansRouter.put(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const params = idParamSchema.safeParse(req.params);
		const body = updatePlanSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const { id } = params.data;
		if (await dao.isSystemPlan(id)) {
			res.status(403).json(rfcErros.forbidden('System workout plans cannot be modified').toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { name, description } = body.data;
		const updated = await dao.updatePlan(id, userId, { name, description });
		if (!updated) {
			res.status(404).json(rfcErros.notFound(`Plan with id ${id} not found or not yours`).toJSON());
			return;
		}
		res.status(200).json(updated);
	})
);

// DELETE /api/workout-plans/:id
workoutPlansRouter.delete(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const { id } = params.data;
		if (await dao.isSystemPlan(id)) {
			res.status(403).json(rfcErros.forbidden('System workout plans cannot be deleted').toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const deleted = await dao.deletePlan(id, userId);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound(`Plan with id ${id} not found or not yours`).toJSON());
			return;
		}
		res.status(204).send();
	})
);

// GET /api/workout-plans/:id/exercises
workoutPlansRouter.get(
	'/:id/exercises',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const { id } = params.data;
		const userId = res.locals.userId as string;
		const exercises = await dao.getExercisesForPlan(id, userId);
		if (exercises === null) {
			res.status(404).json(rfcErros.notFound(`Plan with id ${id} not found or not accessible`).toJSON());
			return;
		}
		res.status(200).json(exercises);
	})
);

// POST /api/workout-plans/:id/exercises
workoutPlansRouter.post(
	'/:id/exercises',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const params = idParamSchema.safeParse(req.params);
		const body = addExerciseSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const { id } = params.data;
		const userId = res.locals.userId as string;
		const { exerciseId, exerciseOrder, targetSets, targetReps, targetWeight, targetDurationMinutes } = body.data;
		const entry = await dao.addExerciseToPlan(
			id,
			userId,
			exerciseId,
			exerciseOrder,
			targetSets,
			targetReps,
			targetWeight,
			targetDurationMinutes
		);
		if (!entry) {
			res.status(404).json(rfcErros.notFound(`Plan with id ${id} not found or not yours`).toJSON());
			return;
		}
		res.status(201).json(entry);
	})
);

// DELETE /api/workout-plans/:id/exercises/:planExerciseId
workoutPlansRouter.delete(
	'/:id/exercises/:planExerciseId',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const params = planExerciseParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const deleted = await dao.removeExerciseFromPlan(params.data.id, params.data.planExerciseId, userId);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound(`Plan exercise not found or not yours`).toJSON());
			return;
		}
		res.status(204).send();
	})
);

// PUT /api/workout-plans/:id/exercises/order
workoutPlansRouter.put(
	'/:id/exercises/order',
	asyncHandler(async (req, res) => {
		const dao: WorkoutPlansDao = req.app.locals.workoutPlansDao;
		const params = idParamSchema.safeParse(req.params);
		const body = updateOrderSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const updated = await dao.updateExerciseOrder(params.data.id, userId, body.data.order);
		if (!updated) {
			res.status(404).json(rfcErros.notFound(`Plan with id ${params.data.id} not found or not yours`).toJSON());
			return;
		}
		res.status(200).json({ message: 'Order updated successfully' });
	})
);
