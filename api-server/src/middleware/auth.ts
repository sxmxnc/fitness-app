/**
 * Autor: Luca Lammers

 */
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { rfcErros } from '../errors/rfc-error.js';
import { SessionDao } from '../dao/sessions.dao.js';

/**
 * Wraps an async route handler and forwards any unhandled rejection to next(),
 * so the global error handler returns a 500 instead of hanging the request.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
	return (
		/**
		 * Handles the wrapped Express request and forwards rejected promises.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req Express request.
		 * @param {Response<any, Record<string, any>, number>} res Express response.
		 * @param {NextFunction} next Express next callback.
		 */
		(req, res, next) => {
			Promise.resolve(fn(req, res, next)).catch(next);
		}
	);
}
/**
 * Checks
 * 1. if there is a jwt Token
 * 2. if its one fitting to the configured Secret
 * 3. the user Id and what role he is
 *
 * @param req must contain `Authorization: Bearer <token>` header
 * @param res sets res.locals.userId and res.locals.userRole on success
 * @param next Called when authentication succeeds
 * @returns 401 if the token is missing, invalid, or expired; 500 if JWT_SECRET is not configured
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
	requireAuthAsync(req, res, next).catch(next);
}

/**
 * Requires auth async before continuing the request.
 * @param {Request} req req.
 * @param {Response} res res.
 * @param {NextFunction} next next.
 */
async function requireAuthAsync(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		res.status(401).json(rfcErros.unauthorized('No token provided').toJSON());
		return;
	}

	const token = authHeader.slice(7);
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		res.status(500).json(rfcErros.internalServerError('Server misconfigured').toJSON());
		return;
	}

	let payload: { id: string; role: string };
	try {
		payload = jwt.verify(token, jwtSecret) as { id: string; role: string };
	} catch {
		res.status(401).json(rfcErros.unauthorized('Invalid or expired token').toJSON());
		return;
	}

	const sessionDao: SessionDao = req.app.locals.sessionDao;
	const sessions = await sessionDao.getUserSessions(payload.id);
	if (
		!sessions.some(
			/**
			 * Checks whether one item satisfies the requested condition.
			 * @param {UserSessions} s s.
			 * @returns {boolean} The operation result.
			 */
			s => !s.isFinished
		)
	) {
		res.status(401).json(rfcErros.unauthorized('No active session').toJSON());
		return;
	}

	res.locals.userId = payload.id;
	res.locals.userRole = payload.role;
	next();
}

/**
 * Express middleware that restricts access to admin users only.
 * Must be used after requireAuth, which sets res.locals.userRole.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Called when the user has the admin role
 * @returns 403 if the authenticated user is not an admin
 */
export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
	if (res.locals.userRole !== 'admin') {
		res.status(403).json(rfcErros.forbidden('Admin access required').toJSON());
		return;
	}
	next();
}

/**
 * Allows access only if the authenticated user is the owner of the resource
 * (req.params.id matches the JWT user id) or an admin.
 * Must be used after requireAuth.
 */
export function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
	const requestorId = res.locals.userId as string;
	const requestorRole = res.locals.userRole as string;
	if (requestorRole === 'admin' || requestorId === req.params.id) {
		return next();
	}
	res.status(403).json(rfcErros.forbidden('Access denied').toJSON());
}
