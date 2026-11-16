/**
 * Autor: Luca Lammers

 */
import express from 'express';
import { SessionDao } from '../dao/sessions.dao.js';
import { rfcErros } from '../errors/rfc-error.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';

export const sessionRouter = express.Router();
sessionRouter.use(requireAuth, requireAdmin);
const uuidV4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

/**
 * GET /admin/session/completed/timeframe?from=<ms>&to=<ms>
 * @returns all finished sessions within the given unix-ms time range
 */
sessionRouter.get(
	'/completed/timeframe',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const sessionDao: SessionDao = req.app.locals.sessionDao;
			const from = req.query.from === undefined ? undefined : Number(req.query.from);
			const to = req.query.to === undefined ? undefined : Number(req.query.to);
			const sessions = await sessionDao.getCompletedSessionsByDay({ from, to });
			res.json(sessions);
		}
	)
);

/**
 * GET /admin/session/:id
 * @param id - UUID v4 of the user
 * @returns all sessions for a specific user
 */
sessionRouter.get(
	'/:id',
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

			const sessions = await sessionDao.getUserSessions(id);
			res.json(sessions);
		}
	)
);
