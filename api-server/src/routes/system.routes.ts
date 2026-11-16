/**
 * Autor: Justus Heinz

 */

import { Router } from 'express';
import { SystemDao } from '../dao/system.dao.js';
import { rfcErros } from '../errors/rfc-error.js';

export const systemRouter = Router();

// POST /api/system/exercises/seed
systemRouter.post('/exercises/seed', async (req, res) => {
	const dao: SystemDao = req.app.locals.systemDao;
	const result = await dao.seedSystemExercises();
	res.status(200).json(result);
});

// POST /api/system/workout-plans/seed
systemRouter.post('/workout-plans/seed', async (req, res) => {
	const dao: SystemDao = req.app.locals.systemDao;
	const result = await dao.seedSystemWorkoutPlans();
	res.status(200).json(result);
});

// GET /api/system/workout-plans
systemRouter.get('/workout-plans', async (req, res) => {
	const dao: SystemDao = req.app.locals.systemDao;
	const plans = await dao.getAllSystemPlans();
	res.status(200).json(plans);
});

// POST /api/system/workout-plans/:id/exercises
systemRouter.post('/workout-plans/:id/exercises', async (req, res) => {
	const dao: SystemDao = req.app.locals.systemDao;
	const planId = req.params.id;
	const { exerciseId, exerciseOrder, targetSets, targetReps, targetWeight, targetDurationMinutes } = req.body;

	if (!exerciseId || exerciseOrder === undefined) {
		res.status(400).json(rfcErros.badRequest('exerciseId and exerciseOrder are required').toJSON());
		return;
	}

	const entry = await dao.addExerciseToSystemPlan(
		planId,
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
});
