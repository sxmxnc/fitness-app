/**
 * Autor: Simon Josef Cebula

 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { SessionDao } from '../dao/sessions.dao.js';
import { rfcErros } from '../errors/rfc-error.js';

const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000; // 24-hour session window

/**
 * Validates session age.
 * @param {Request} req req.
 * @param {Response} res res.
 * @param {NextFunction} next next.
 */
export function validateSessionAge(req: Request, res: Response, next: NextFunction) {
	validateSessionAgeAsync(req, res, next).catch(next);
}

/**
 * Validates session age async.
 * @param {Request} req req.
 * @param {Response} res res.
 * @param {NextFunction} next next.
 */
async function validateSessionAgeAsync(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		next();
		return;
	}

	const token = authHeader.slice(7);
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		next();
		return;
	}

	let payload: { id: string };
	try {
		payload = jwt.verify(token, jwtSecret) as { id: string };
	} catch {
		next();
		return;
	}

	const sessionDao: SessionDao = req.app.locals.sessionDao;
	const sessions = await sessionDao.getUserSessions(payload.id);
	const activeSession = sessions.find(
		/**
		 * Finds the first item matching the requested condition.
		 * @param {UserSessions} s s.
		 * @returns {boolean} The operation result.
		 */
		s => !s.isFinished
	);

	if (!activeSession) {
		next();
		return;
	}

	if (Date.now() - activeSession.startedAt > MAX_SESSION_AGE_MS) {
		// finish all sessions for this user, not just the active one
		await sessionDao.finishUserSessions(payload.id, Date.now());
		res.status(401).json(rfcErros.unauthorized('Session expired').toJSON());
		return;
	}

	next();
}
