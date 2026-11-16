/**
 * Autor: Justus Heinz

 */
import express from 'express';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';
import { ExercisesDao } from '../dao/exercises.dao.js';
import { rfcErros } from '../errors/rfc-error.js';
import { nonEmptyTextSchema, optionalTextSchema, uuidV4Schema, validationDetail } from '../utils/validation.util.js';
import { z } from 'zod';

export const adminExerciseRouter = express.Router();

const adminExerciseSchema = z.object({
	name: nonEmptyTextSchema(120),
	type: z.enum(['weighted', 'bodyweight', 'cardio']),
	description: optionalTextSchema(1000),
	muscleGroup: optionalTextSchema(120)
});

const exerciseParamSchema = z.object({
	id: uuidV4Schema
});

/**
 * GET /api/admin/exercises
 * Returns all system exercises
 */
adminExerciseRouter.get(
	'/exercises',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const exercises = await dao.getSystemExercises();
		res.json(exercises);
	})
);

/**
 * POST /api/admin/exercises
 * Creates a new system exercise
 */
adminExerciseRouter.post(
	'/exercises',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const result = adminExerciseSchema.safeParse(req.body);
		if (!result.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(result.error)).toJSON());
			return;
		}

		const { name, type, description, muscleGroup } = result.data;
		const exercise = await dao.adminCreateSystemExercise(name, type, description, muscleGroup);
		res.status(201).json(exercise);
	})
);

/**
 * DELETE /api/admin/exercises/:id
 * Soft-deletes a system exercise
 */
adminExerciseRouter.delete(
	'/exercises/:id',
	requireAuth,
	requireAdmin,
	asyncHandler(async (req, res) => {
		const dao: ExercisesDao = req.app.locals.exercisesDao;
		const params = exerciseParamSchema.safeParse(req.params);
		if (!params.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(params.error)).toJSON());
			return;
		}

		const deleted = await dao.adminDeleteSystemExercise(params.data.id);
		if (!deleted) {
			res.status(404).json(rfcErros.notFound('System exercise not found').toJSON());
			return;
		}
		res.status(204).send();
	})
);
