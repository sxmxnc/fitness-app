/**
 * Autor: Luca Lammers

 */

/**
 * Aggregated stats endpoint for the admin overview dashboard.
 * Returns all required stats in a single request to avoid multiple round trips.
 */
import express from 'express';
import { z } from 'zod';
import { SessionDao } from '../dao/sessions.dao.js';
import { UserDao } from '../dao/users.dao.js';

import { requireAuth, requireOwnerOrAdmin, asyncHandler } from '../middleware/auth.js';
import { rfcErros } from '../errors/rfc-error.js';
export const userStatsRouter = express.Router();
userStatsRouter.use(requireAuth);

const updateGoalsSchema = z
	.object({
		weight: z.number().min(1).max(200).optional(),
		height: z.number().min(1).max(300).optional(),
		birthDate: z
			.number()
			.min(1)
			.refine(
				/**
				 * Validates an additional schema constraint.
				 * @param {number} val val.
				 * @returns {boolean} The operation result.
				 */
				val => val <= Date.now(),
				{ message: 'birthDate cannot be in the future' }
			)
			.optional(),
		dailyCalorieGoal: z.number().min(1).max(5000).optional(),
		dailyProteinGoal: z.number().min(1).max(400).optional(),
		dailyFatGoal: z.number().min(1).max(400).optional(),
		dailyCarbsGoal: z.number().min(1).max(400).optional()
	})
	.refine(
		/**
		 * Validates an additional schema constraint.
		 * @param {{ weight?: number; height?: number; birthDate?: number; dailyCalorieGoal?: number; dailyProteinGoal?: number; dailyFatGoal?: number; dailyCarbsGoal?: number; }} data data.
		 * @returns {boolean} The operation result.
		 */
		data => Object.keys(data).length > 0,
		{
			message: 'At least one field must be provided'
		}
	);

const uuidV4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

/**
 * PATCH /api/usersStats/:id/stats
 * @param id - UUID v4 of the user
 * @body weight, height, birthDate, dailyCalorieGoal, dailyProteinGoal, dailyFatGoal, dailyCarbsGoal (at least one required)
 * @returns 204 on success, 404 if not found, 400 if validation fails
 */
userStatsRouter.patch(
	'/:id/stats',
	requireOwnerOrAdmin,
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const userDao: UserDao = req.app.locals.userDao;
			const id = req.params.id as string;

			if (!uuidV4.test(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const result = updateGoalsSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(rfcErros.badRequest(result.error.issues[0].message).toJSON());
				return;
			}

			const updated = await userDao.updateGoals(id, result.data);

			if (updated) {
				res.status(204).send();
			} else {
				res.status(404).json(rfcErros.notFound(`User with id ${id} not found`).toJSON());
			}
		}
	)
);

/**
 * GET /api/usersStats/:id/activity?from=<ms>&to=<ms>
 * @param id - UUID v4 of the user (must match the authenticated user, unless admin)
 * @returns login activity grouped by day for the given user
 */
userStatsRouter.get(
	'/:id/activity',
	requireOwnerOrAdmin,
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const sessionDao: SessionDao = req.app.locals.sessionDao;
			const id = req.params.id as string;

			if (!new RegExp(uuidV4).exec(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const from = req.query.from === undefined ? undefined : Number(req.query.from);
			const to = req.query.to === undefined ? undefined : Number(req.query.to);

			const activity = await sessionDao.getUserActivityByDay(id, { from, to });
			res.json(activity);
		}
	)
);
