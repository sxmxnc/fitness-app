/**
 * Autor: Justus Heinz

 */

import { Router } from 'express';
import { z } from 'zod';
import { ExercisesDao } from '../dao/exercises.dao.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { rfcErros } from '../errors/rfc-error.js';
import { nonEmptyTextSchema, optionalTextSchema, uuidV4Schema, validationDetail } from '../utils/validation.util.js';

export const exercisesRouter = Router();

exercisesRouter.use(requireAuth);

const idParamSchema = z.object({
	id: uuidV4Schema
});

const createExerciseSchema = z.object({
	name: nonEmptyTextSchema(120),
	type: z.enum(['weighted', 'bodyweight', 'cardio']),
	description: optionalTextSchema(1000),
	muscleGroup: optionalTextSchema(120)
});

const updateExerciseSchema = createExerciseSchema.partial().refine(data => Object.keys(data).length > 0, {
	message: 'At least one field must be provided'
});

// GET /api/exercises
exercisesRouter.get(
	'/',
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const userId = res.locals.userId as string;
		const exercises = await dao.getAllExercises(userId);
		res.status(200).json(exercises);
	})
);

// GET /api/exercises/:id
exercisesRouter.get(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const { id } = params.data;
		const userId = res.locals.userId as string;
		const exercise = await dao.getExerciseById(id, userId);
		if (!exercise) {
			res.status(404).json(rfcErros.notFound(`Exercise with id ${id} not found`).toJSON());
			return;
		}
		res.status(200).json(exercise);
	})
);

// POST /api/exercises
exercisesRouter.post(
	'/',
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const body = createExerciseSchema.safeParse(req.body);
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const { name, type, description, muscleGroup } = body.data;
		const exercise = await dao.createExercise(userId, name, type, description, muscleGroup);
		res.status(201).json(exercise);
	})
);

// PUT /api/exercises/:id
exercisesRouter.put(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const params = idParamSchema.safeParse(req.params);
		const body = updateExerciseSchema.safeParse(req.body);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}
		if (!body.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(body.error)).toJSON());
			return;
		}

		const { id } = params.data;
		if (await dao.isSystemExercise(id)) {
			res.status(403).json(rfcErros.forbidden('System exercises cannot be modified').toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const updated = await dao.updateExercise(id, userId, body.data);
		if (!updated) {
			res.status(404).json(rfcErros.notFound(`Exercise with id ${id} not found or not yours`).toJSON());
			return;
		}
		res.status(200).json(updated);
	})
);

// DELETE /api/exercises/:id
exercisesRouter.delete(
	'/:id',
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const params = idParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const { id } = params.data;
		if (await dao.isSystemExercise(id)) {
			res.status(403).json(rfcErros.forbidden('System exercises cannot be deleted').toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const deleted = await dao.deleteExercise(id, userId);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound(`Exercise with id ${id} not found or not yours`).toJSON());
			return;
		}
		res.status(204).send();
	})
);
