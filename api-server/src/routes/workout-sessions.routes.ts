/**
 * Autor: Justus Heinz

 */

import { Router } from 'express';
import { z } from 'zod';
import { WorkoutSessionsDao } from '../dao/workout-sessions.dao.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { rfcErros } from '../errors/rfc-error.js';
import {
	optionalNonNegativeNumberSchema,
	optionalPositiveIntSchema,
	optionalTextSchema,
	positiveIntSchema,
	timestampQuerySchema,
	uuidV4Schema,
	validationDetail
} from '../utils/validation.util.js';

export const workoutSessionsRouter = Router();

workoutSessionsRouter.use(requireAuth);

const idParamSchema = z.object({ id: uuidV4Schema });
const sessionExerciseParamSchema = z.object({ id: uuidV4Schema, sessionExerciseId: uuidV4Schema });

const activeSessionsQuerySchema = z.object({
	status: z.literal('active')
});

const statsQuerySchema = z
	.object({
		from: timestampQuerySchema,
		to: timestampQuerySchema
	})
	.refine(data => data.from === undefined || data.to === undefined || data.from <= data.to, {
		message: 'from must be before or equal to to'
	});

const startSessionSchema = z.object({
	workoutPlanId: uuidV4Schema.optional(),
	workoutDate: timestampQuerySchema,
	notes: optionalTextSchema(1000)
});

const updateSessionSchema = z
	.object({
		notes: optionalTextSchema(1000),
		workoutDate: timestampQuerySchema
	})
	.refine(data => data.notes !== undefined || data.workoutDate !== undefined, {
		message: 'At least one field must be provided'
	});

const addSessionExerciseSchema = z.object({
	exerciseId: uuidV4Schema,
	exerciseOrder: positiveIntSchema(500),
	actualSets: optionalPositiveIntSchema(100),
	actualReps: optionalPositiveIntSchema(1000),
	actualWeight: optionalNonNegativeNumberSchema(2000),
	actualDurationMinutes: optionalPositiveIntSchema(1440),
	notes: optionalTextSchema(1000)
});

const updateSessionExerciseSchema = z
	.object({
		actualSets: optionalPositiveIntSchema(100),
		actualReps: optionalPositiveIntSchema(1000),
		actualWeight: optionalNonNegativeNumberSchema(2000),
		actualDurationMinutes: optionalPositiveIntSchema(1440),
		notes: optionalTextSchema(1000)
	})
	.refine(
		data =>
			data.actualSets !== undefined ||
			data.actualReps !== undefined ||
			data.actualWeight !== undefined ||
			data.actualDurationMinutes !== undefined ||
			data.notes !== undefined,
		{ message: 'At least one field must be provided' }
	);

// GET /api/workout-sessions/stats/by-day?from=<ms>&to=<ms>
workoutSessionsRouter.get(
	'/stats/by-day',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const query = statsQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const stats = await dao.getExerciseStatsByDay(userId, { from: query.data.from, to: query.data.to });
		res.status(200).json(stats);
	})
);

// POST /api/workout-sessions
workoutSessionsRouter.post(
	'/',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const body = startSessionSchema.safeParse(req.body);
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { workoutPlanId, workoutDate, notes } = body.data;
		const session = await dao.startSession(userId, workoutPlanId, workoutDate, notes);
		if (!session) {
			res.status(404).json(rfcErros.notFound('Workout plan not found or not yours').toJSON());
			return;
		}
		res.status(201).json(session);
	})
);

// GET /api/workout-sessions?status=active
workoutSessionsRouter.get(
	'/',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const query = activeSessionsQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const sessions = await dao.getActiveSessions(userId);
		res.status(200).json(sessions);
	})
);

// GET /api/workout-sessions/:id
workoutSessionsRouter.get(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const session = await dao.getSessionById(params.data.id, userId);
		if (!session) {
			res.status(404).json(rfcErros.notFound(`Session with id ${params.data.id} not found`).toJSON());
			return;
		}
		res.status(200).json(session);
	})
);

// PUT /api/workout-sessions/:id/finish
workoutSessionsRouter.put(
	'/:id/finish',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const session = await dao.finishSession(params.data.id, userId);
		if (!session) {
			res.status(404).json(
				rfcErros.notFound(`Session with id ${params.data.id} not found, already finished, or deleted`).toJSON()
			);
			return;
		}
		res.status(200).json(session);
	})
);

// PUT /api/workout-sessions/:id
workoutSessionsRouter.put(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = idParamSchema.safeParse(req.params);
		const body = updateSessionSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { notes, workoutDate } = body.data;
		const session = await dao.updateSession(params.data.id, userId, { notes, workoutDate });
		if (!session) {
			res.status(404).json(rfcErros.notFound(`Session with id ${params.data.id} not found or deleted`).toJSON());
			return;
		}
		res.status(200).json(session);
	})
);

// DELETE /api/workout-sessions/:id
workoutSessionsRouter.delete(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const deleted = await dao.deleteSession(params.data.id, userId);
		if (!deleted) {
			res.status(404).json(
				rfcErros.notFound(`Session with id ${params.data.id} not found or already deleted`).toJSON()
			);
			return;
		}
		res.status(204).send();
	})
);

// POST /api/workout-sessions/:id/exercises
workoutSessionsRouter.post(
	'/:id/exercises',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = idParamSchema.safeParse(req.params);
		const body = addSessionExerciseSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { exerciseId, exerciseOrder, actualSets, actualReps, actualWeight, actualDurationMinutes, notes } =
			body.data;
		const entry = await dao.addExerciseToSession(
			params.data.id,
			userId,
			exerciseId,
			exerciseOrder,
			actualSets,
			actualReps,
			actualWeight,
			actualDurationMinutes,
			notes
		);
		if (!entry) {
			res.status(404).json(
				rfcErros.notFound(`Session with id ${params.data.id} not found or not yours`).toJSON()
			);
			return;
		}
		res.status(201).json(entry);
	})
);

// PUT /api/workout-sessions/:id/exercises/:sessionExerciseId
workoutSessionsRouter.put(
	'/:id/exercises/:sessionExerciseId',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = sessionExerciseParamSchema.safeParse(req.params);
		const body = updateSessionExerciseSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { actualSets, actualReps, actualWeight, actualDurationMinutes, notes } = body.data;
		const entry = await dao.updateSessionExercise(params.data.id, params.data.sessionExerciseId, userId, {
			actualSets,
			actualReps,
			actualWeight,
			actualDurationMinutes,
			notes
		});
		if (!entry) {
			res.status(404).json(rfcErros.notFound('Session exercise not found or not yours').toJSON());
			return;
		}
		res.status(200).json(entry);
	})
);

// DELETE /api/workout-sessions/:id/exercises/:sessionExerciseId
workoutSessionsRouter.delete(
	'/:id/exercises/:sessionExerciseId',
	asyncHandler(async (req, res) => {
		const dao: WorkoutSessionsDao = req.app.locals.workoutSessionsDao;
		const params = sessionExerciseParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const deleted = await dao.removeExerciseFromSession(params.data.id, params.data.sessionExerciseId, userId);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound('Session exercise not found or not yours').toJSON());
			return;
		}
		res.status(204).send();
	})
);
