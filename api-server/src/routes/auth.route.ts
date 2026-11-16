/**
 * Autor: Luca Lammers

 */
import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import {
	UserService,
	InvalidCredentialsError,
	InvalidResetTokenError,
	PasswordConfirmationError,
	PasswordPolicyError,
	SecurityAnswerError,
	SecurityQuestionNotSetError,
	TooManySecurityAnswerAttemptsError
} from '../services/user.service.js';
import { SessionDao } from '../dao/sessions.dao.js';
import { rfcErros } from '../errors/rfc-error.js';
import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1)
});

const resetRequestSchema = z.object({
	email: z.email()
});

const resetPasswordSchema = z.object({
	token: z.string().min(20),
	newPassword: z.string().min(1),
	repeatPassword: z.string().min(1)
});

const verifySecurityAnswerSchema = z.object({
	email: z.email(),
	answer: z.string().min(1)
});

export const authRouter = express.Router();

/**
 * POST /api/auth/login
 * @body email, password
 * @returns 200 { token } on success, 401 on wrong credentials, 400 on invalid input
 */
authRouter.post(
	'/login',
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 10,
		keyPrefix: 'login',
		/**
		 * Handles key.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @returns {string} The operation result.
		 */
		key: req => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`,
		skipSuccessfulRequests: true
	}),
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const userService: UserService = req.app.locals.userService;

			const result = loginSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(rfcErros.badRequest(result.error.issues[0].message).toJSON());
				return;
			}

			try {
				const { token, userId } = await userService.login(result.data.email, result.data.password);
				const sessionDao: SessionDao = req.app.locals.sessionDao;
				await sessionDao.startSession(uuidv4(), userId, Date.now());
				res.json({ token });
			} catch (err) {
				if (err instanceof InvalidCredentialsError) {
					res.status(401).json(rfcErros.unauthorized('Invalid email or password').toJSON());
				} else {
					res.status(500).json(rfcErros.internalServerError('Login failed').toJSON());
				}
			}
		}
	)
);

authRouter.post(
	'/request-password-reset',
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 5,
		keyPrefix: 'password-reset-request',
		/**
		 * Handles key.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @returns {string} The operation result.
		 */
		key: req => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`
	}),
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const result = resetRequestSchema.safeParse(req.body);
			if (result.success) {
				const userService: UserService = req.app.locals.userService;
				try {
					const reset = await userService.requestPasswordReset(result.data.email);
					if (reset) {
						res.status(200).json(reset);
						return;
					}
				} catch (err) {
					if (err instanceof SecurityQuestionNotSetError) {
						res.status(404).json(
							rfcErros.notFound('Für dieses Konto ist keine Sicherheitsfrage hinterlegt.').toJSON()
						);
						return;
					}
					throw err;
				}
			}

			res.status(200).json({ question: null });
		}
	)
);

authRouter.post(
	'/verify-security-answer',
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 10,
		keyPrefix: 'security-answer',
		/**
		 * Handles key.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @returns {string} The operation result.
		 */
		key: req => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`,
		skipSuccessfulRequests: true
	}),
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const result = verifySecurityAnswerSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(
					rfcErros.badRequest('Die Sicherheitsantwort konnte nicht geprüft werden.').toJSON()
				);
				return;
			}

			try {
				const userService: UserService = req.app.locals.userService;
				const token = await userService.verifySecurityAnswer(result.data.email, result.data.answer);
				res.status(200).json({ token });
			} catch (err) {
				if (err instanceof TooManySecurityAnswerAttemptsError) {
					res.status(429).json(
						rfcErros.tooManyRequests('Zu viele Versuche. Bitte versuche es später erneut.').toJSON()
					);
				} else if (err instanceof SecurityAnswerError) {
					res.status(401).json(rfcErros.unauthorized('Die Angaben konnten nicht bestätigt werden.').toJSON());
				} else {
					throw err;
				}
			}
		}
	)
);

authRouter.post(
	'/reset-password',
	rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'password-reset' }),
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 * @throws {Error} When validation fails or the operation cannot be completed.
		 */
		async (req, res) => {
			const result = resetPasswordSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(rfcErros.badRequest('Das Passwort konnte nicht zurückgesetzt werden.').toJSON());
				return;
			}

			try {
				const userService: UserService = req.app.locals.userService;
				const userId = await userService.resetPassword(
					result.data.token,
					result.data.newPassword,
					result.data.repeatPassword
				);
				const sessionDao: SessionDao = req.app.locals.sessionDao;
				await sessionDao.finishUserSessions(userId, Date.now());
				res.status(204).send();
			} catch (err) {
				if (err instanceof InvalidResetTokenError) {
					res.status(400).json(
						rfcErros.badRequest('Das Passwort konnte nicht zurückgesetzt werden.').toJSON()
					);
				} else if (err instanceof PasswordConfirmationError) {
					res.status(400).json(rfcErros.badRequest('Die Passwörter stimmen nicht überein.').toJSON());
				} else if (err instanceof PasswordPolicyError) {
					res.status(400).json(rfcErros.badRequest(err.errors[0]).toJSON());
				} else {
					throw err;
				}
			}
		}
	)
);

/**
 * GET /api/auth/verify
 * @header Authorization: Bearer <token>
 * @returns 200 if token is valid and user has an active session, 401 otherwise
 */
authRouter.get(
	'/verify',
	requireAuth,
	/**
	 * Handles GET requests for the /verify route.
	 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} _req req.
	 * @param {Response<any, Record<string, any>, number>} res res.
	 */

	(_req, res) => {
		res.status(200).json({ valid: true });
	}
);

/**
 * POST /api/auth/logout
 * @header Authorization: Bearer <token>
 * @returns 200 on success, 401 if token missing/invalid
 */
authRouter.post(
	'/logout',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
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

			try {
				const payload = jwt.verify(token, jwtSecret, { ignoreExpiration: true }) as { id: string };
				const sessionDao: SessionDao = req.app.locals.sessionDao;
				await sessionDao.finishUserSessions(payload.id, Date.now());
				res.status(200).json({ message: 'Logged out successfully' });
			} catch {
				res.status(401).json(rfcErros.unauthorized('Invalid token').toJSON());
			}
		}
	)
);
