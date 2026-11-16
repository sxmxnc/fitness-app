/**
 * Autor: Luca Lammers

 */

/**
 * aggregated stats endpoint for the admin overview dashboard.
 * returns all required stats in a single request to avoid multiple round trips.
 */
import express from 'express';
import { SessionDao } from '../dao/sessions.dao.js';
import { UserDao } from '../dao/users.dao.js';
import { FoodService } from '../services/food.service.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';
import { rfcErros } from '../errors/rfc-error.js';

export const adminStatsRouter = express.Router();
adminStatsRouter.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/stats
 * @returns activeSessions, userCount, sessionsByDay, popularTimes
 */
adminStatsRouter.get(
	'/',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const sessionDao: SessionDao = req.app.locals.sessionDao;
			const userDao: UserDao = req.app.locals.userDao;

			const [activeSessions, userCount, sessionsByDay, popularTimes] = await Promise.all([
				sessionDao.getActiveSessionCount(),
				userDao.getNonAdminCount(),
				sessionDao.getSessionsByDay(),
				sessionDao.getPopularTimes()
			]);

			res.json({ activeSessions, userCount, sessionsByDay, popularTimes });
		}
	)
);

/**
 * GET /api/admin/stats/user-activity?from=<ms>&to=<ms>
 * @returns registeredUsers: non-admin users registered in range
 *          activeUsers: distinct users who started a session in range
 */
adminStatsRouter.get(
	'/user-activity',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const sessionDao: SessionDao = req.app.locals.sessionDao;
			const userDao: UserDao = req.app.locals.userDao;
			const from = req.query.from === undefined ? undefined : Number(req.query.from);
			const to = req.query.to === undefined ? undefined : Number(req.query.to);
			const [registeredUsers, activeUsers] = await Promise.all([
				userDao.getRegisteredUserCountInTimeframe({ from, to }),
				sessionDao.getActiveUserCountInTimeframe({ from, to })
			]);
			res.json({ registeredUsers, activeUsers });
		}
	)
);

const UUID_V4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

/**
 * GET /api/admin/stats/users
 * @returns list of all non-admin users with id, firstName, lastName, email, createdAt, isDeactivated
 */
adminStatsRouter.get(
	'/users',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const userDao: UserDao = req.app.locals.userDao;
			const users = await userDao.getAllNonAdminUsers();
			res.json(users);
		}
	)
);

/**
 * PATCH /api/admin/stats/users/:id/reactivate
 * @param id - UUID v4 of the user to reactivate
 * @returns 204 on success, 404 if not found or already active
 */
adminStatsRouter.patch(
	'/users/:id/reactivate',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const userDao: UserDao = req.app.locals.userDao;
			const id = req.params.id as string;

			if (!new RegExp(UUID_V4).exec(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const reactivated = await userDao.reactivateUser(id);

			if (reactivated) {
				res.status(204).send();
			} else {
				res.status(404).json(rfcErros.notFound(`User with id ${id} not found or already active`).toJSON());
			}
		}
	)
);

/**
 * GET /api/admin/stats/food/:userId
 * returns food-tracking stats for a user over the last 30 days:
 * avgCalories, avgProtein, avgFat, avgCarbs, trackedDays
 */
adminStatsRouter.get(
	'/food/:userId',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const foodService: FoodService = req.app.locals.foodService;
			const userId = req.params.userId as string;

			if (!new RegExp(UUID_V4).exec(userId)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const stats = await foodService.items.getAdminFoodStats(userId);
			res.json(stats);
		}
	)
);
