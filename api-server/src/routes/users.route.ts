/**
 * Autor: Luca Lammers

 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UserDao } from '../dao/users.dao.js';
import { SessionDao } from '../dao/sessions.dao.js';
import { rfcErros } from '../errors/rfc-error.js';
import {
	UserService,
	EmailAlreadyInUseError,
	UserNotFoundError,
	InvalidCredentialsError,
	PasswordConfirmationError,
	PasswordPolicyError
} from '../services/user.service.js';
import { requireAuth, requireAdmin, requireOwnerOrAdmin, asyncHandler } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';
import { SECURITY_QUESTION_KEYS } from '../utils/security-questions.util.js';
/**
 * [Q] What is Zod?
 * [A] Zod is a TS validation library to validate data at runtime
 *     for more information view https://zod.dev/
 */
import { z } from 'zod';

const updateUserSchema = z
	.object({
		firstName: z.string().min(1).optional(),
		lastName: z.string().min(1).optional(),
		email: z.email().optional()
	})
	.refine(
		/**
		 * Validates an additional schema constraint.
		 * @param {{ firstName?: string; lastName?: string; email?: string; }} data data.
		 * @returns {boolean} The operation result.
		 */
		data => Object.keys(data).length > 0,
		{
			message: 'At least one field must be provided'
		}
	);

const changeRoleSchema = z.object({
	role: z.enum(['user', 'admin'])
});

const createUserSchema = z.object({
	email: z.email('Invalid email address'),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	password: z.string().min(1),
	repeatPassword: z.string().min(1).optional(),
	weight: z.number().min(1).max(200),
	height: z.number().min(1).max(300),
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
		),
	dailyCalorieGoal: z.number().min(1).max(5000),
	dailyProteinGoal: z.number().min(1).max(400),
	dailyFatGoal: z.number().min(1).max(400),
	dailyCarbsGoal: z.number().min(1).max(400),
	securityQuestionKey: z.enum(SECURITY_QUESTION_KEYS),
	securityAnswer: z.string().trim().min(1)
});

export const usersRouter = express.Router();
const uuidV4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
const validEmail = new RegExp(
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);

// --- Public routes (no authentication required) ---

/**
 * POST /api/users/validateEmail
 * Validates the format of an email address only – does NOT check for duplicates.
 * Intentionally avoids a DB lookup to prevent unauthenticated email enumeration.
 * Duplicate emails are reported at registration time (POST /api/users).
 * @body email - the email address to validate
 * @returns 200 if the format is valid, 400 if not
 */
usersRouter.post(
	'/validateEmail',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const { email } = req.body;

			if (!email || !validEmail.test(email)) {
				res.status(400).json(rfcErros.badRequest('Invalid email address').toJSON());
				return;
			}

			res.status(200).send();
		}
	)
);

/**
 * POST /api/users
 * @body firstName, lastName, role, password (required)
 * @body weight, height, birthDate, dailyCalorieGoal, dailyProteinGoal, dailyFatGoal, dailyCarbsGoal (optional)
 * @returns 201 with the id and token of the newly created user, or 400 if validation fails
 */
usersRouter.post(
	'/',
	rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'register' }),
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const result = createUserSchema.safeParse(req.body);
			if (!result.success) {
				const issue = result.error.issues[0];
				const field = issue.path[0] as string | undefined;
				const detail = field ? `${field}: ${issue.message}` : issue.message;
				res.status(400).json(rfcErros.badRequest(detail).toJSON());
				return;
			}

			try {
				const userService: UserService = req.app.locals.userService;
				const { id, token } = await userService.register(result.data);
				const sessionDao: SessionDao = req.app.locals.sessionDao;
				await sessionDao.startSession(uuidv4(), id, Date.now());
				res.status(201).json({ id, token });
			} catch (err) {
				if (err instanceof EmailAlreadyInUseError) {
					res.status(409).json(rfcErros.conflict('Email already in use').toJSON());
				} else if (err instanceof PasswordConfirmationError) {
					res.status(400).json(rfcErros.badRequest('Die Passwörter stimmen nicht überein.').toJSON());
				} else if (err instanceof PasswordPolicyError) {
					res.status(400).json(rfcErros.badRequest(err.errors[0]).toJSON());
				} else {
					res.status(500).json(rfcErros.internalServerError('Failed to create user').toJSON());
				}
			}
		}
	)
);

// --- Protected routes (valid JWT required) ---
usersRouter.use(requireAuth);

/**
 * GET /api/users/data/:id
 * @param id - UUID v4 of the user
 * @returns the user + user_stats or 404 if not found, 400 if id is not a valid UUID
 */
usersRouter.get(
	'/data/:id',
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
			if (!new RegExp(uuidV4).exec(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const user = await userDao.getUserData(id);

			if (user) {
				res.json(user);
			} else {
				res.status(404).json(rfcErros.notFound(`User with id ${id} not found`).toJSON());
			}
		}
	)
);

/**
 * PATCH /api/users/:id
 * @param id - UUID v4 of the user
 * @body firstName, lastName, email (at least one required)
 * @returns 204 on success, 404 if not found, 400 if validation fails
 */
usersRouter.patch(
	'/:id',
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

			if (!id.match(uuidV4)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const result = updateUserSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(rfcErros.badRequest(result.error.issues[0].message).toJSON());
				return;
			}

			const changes: { firstName?: string; lastName?: string; email?: string } = {};
			if (result.data.firstName) changes.firstName = result.data.firstName;
			if (result.data.lastName) changes.lastName = result.data.lastName;
			if (result.data.email) {
				const existing = await userDao.getByEmail(result.data.email);
				if (existing && existing.id !== id) {
					res.status(409).json(rfcErros.conflict('Email already in use').toJSON());
					return;
				}
				changes.email = result.data.email;
			}

			const updated = await userDao.updateProfileData(id, changes);

			if (updated) {
				res.status(204).send();
			} else {
				res.status(404).json(rfcErros.notFound(`User with id ${id} not found`).toJSON());
			}
		}
	)
);

/**
 * PATCH /api/users/:id/role
 * @param id - UUID v4 of the user
 * @body role - 'user' or 'admin'
 * @returns 204 on success, 404 if not found, 400 if validation fails
 */
usersRouter.patch(
	'/:id/role',
	requireAdmin,
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const userDao: UserDao = req.app.locals.userDao;
			const id = req.params.id as string;

			if (!new RegExp(uuidV4).exec(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const result = changeRoleSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(rfcErros.badRequest(result.error.issues[0].message).toJSON());
				return;
			}

			const changed = await userDao.changeRole(id, result.data.role);

			if (changed) {
				res.status(204).send();
			} else {
				res.status(404).json(rfcErros.notFound(`User with id ${id} not found`).toJSON());
			}
		}
	)
);

/**
 * PATCH /api/users/:id/password
 * @param id - UUID v4 of the user
 * @body currentPassword, newPassword
 * @returns 204 on success, 401 if currentPassword is wrong, 404 if not found, 400 if validation fails
 */
const changePasswordSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(1),
	repeatPassword: z.string().min(1)
});

usersRouter.patch(
	'/:id/password',
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 10,
		keyPrefix: 'change-password',
		/**
		 * Handles key.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @returns {string} The operation result.
		 */
		key: req => `${req.ip}:${req.params.id ?? 'unknown'}`,
		skipSuccessfulRequests: true
	}),
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 * @throws {Error} When validation fails or the operation cannot be completed.
		 */
		async (req, res) => {
			const id = req.params.id as string;

			if (!new RegExp(uuidV4).exec(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			if (res.locals.userId !== id) {
				res.status(403).json(rfcErros.forbidden('Access denied').toJSON());
				return;
			}

			const result = changePasswordSchema.safeParse(req.body);
			if (!result.success) {
				res.status(400).json(rfcErros.badRequest(result.error.issues[0].message).toJSON());
				return;
			}

			const userService: UserService = req.app.locals.userService;
			const sessionDao: SessionDao = req.app.locals.sessionDao;
			try {
				await userService.changePassword(
					id,
					result.data.currentPassword,
					result.data.newPassword,
					result.data.repeatPassword
				);
				await sessionDao.finishUserSessions(id, Date.now());
				res.status(204).send();
			} catch (err) {
				if (err instanceof UserNotFoundError) {
					res.status(404).json(rfcErros.notFound(`User with id ${id} not found`).toJSON());
				} else if (err instanceof InvalidCredentialsError) {
					res.status(401).json(rfcErros.unauthorized('Current password is incorrect').toJSON());
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
 * DELETE /api/users/:id
 * @param id - UUID v4 of the user to deactivate
 * @returns 204 on success, 404 if not found, 400 if id is not a valid UUID
 */
usersRouter.delete(
	'/:id',
	requireOwnerOrAdmin,
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const userDao: UserDao = req.app.locals.userDao;
			const sessionDao: SessionDao = req.app.locals.sessionDao;
			const id = req.params.id as string;

			if (!new RegExp(uuidV4).exec(id)) {
				res.status(400).json(rfcErros.badRequest('Given ID is not a valid UUID').toJSON());
				return;
			}

			const deactivated = await userDao.deactivateUser(id);

			if (deactivated) {
				await sessionDao.finishUserSessions(id, Date.now());
				res.status(204).send();
			} else {
				res.status(404).json(rfcErros.notFound(`User with id ${id} not found`).toJSON());
			}
		}
	)
);
