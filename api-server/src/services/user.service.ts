/**
 * Autor: Luca Lammers

 */
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserDao } from '../dao/users.dao.js';
import config from '../../config.json' with { type: 'json' };
import { User } from '../models/user_entitys/user.js';
import { UserStats } from '../models/user_entitys/user_stats.js';
import {
	createPasswordResetToken,
	hashPassword,
	hashResetToken,
	normalizeSecurityAnswer,
	passwordPolicy,
	validatePasswordPolicy,
	verifyPassword
} from '../utils/password-security.util.js';
import { SECURITY_QUESTIONS, SecurityQuestionKey } from '../utils/security-questions.util.js';

/** Represents a user not found domain error. */
export class UserNotFoundError extends Error {
	/** Creates a new user not found error instance. */
	constructor() {
		super('User not found');
	}
}

/** Represents a email already in use domain error. */
export class EmailAlreadyInUseError extends Error {
	/** Creates a new email already in use error instance. */
	constructor() {
		super('Email already in use');
	}
}

/** Represents a invalid credentials domain error. */
export class InvalidCredentialsError extends Error {
	/** Creates a new invalid credentials error instance. */
	constructor() {
		super('Invalid email or password');
	}
}

/** Represents a password policy domain error. */
export class PasswordPolicyError extends Error {
	/**
	 * Creates a new password policy error instance.
	 * @param {string[]} errors errors.
	 */
	constructor(readonly errors: string[]) {
		super('Password does not satisfy policy');
	}
}

/** Represents a password confirmation domain error. */
export class PasswordConfirmationError extends Error {
	/** Creates a new password confirmation error instance. */
	constructor() {
		super('Password confirmation does not match');
	}
}

/** Represents a invalid reset token domain error. */
export class InvalidResetTokenError extends Error {
	/** Creates a new invalid reset token error instance. */
	constructor() {
		super('Invalid or expired reset token');
	}
}

/** Represents a security question reset flow error that must not reveal account details. */
export class SecurityQuestionNotSetError extends Error {
	/** Creates a new error for an account without a (valid) security question. */
	constructor() {
		super('No security question is set up for this account');
	}
}

export class SecurityAnswerError extends Error {
	/** Creates a new security answer error instance. */
	constructor() {
		super('Security answer could not be verified');
	}
}

/** Represents a too many security-answer attempts domain error. */
export class TooManySecurityAnswerAttemptsError extends Error {
	/** Creates a new too many attempts error instance. */
	constructor() {
		super('Too many security answer attempts');
	}
}

/** Coordinates business logic for user. */
export class UserService {
	/**
	 * Creates a new user service instance.
	 * @param {UserDao} userDao user dao.
	 */
	constructor(private readonly userDao: UserDao) {}

	/**
	 * Checks whether an email address is not yet registered.
	 * @param email - the email to check
	 * @returns true if the email is available, false if it is already in use
	 */
	async isEmailAvailable(email: string): Promise<boolean> {
		const existing = await this.userDao.getByEmail(email);
		return existing === null;
	}

	/**
	 * Creates a new user with hashed password and initial stats.
	 * @param data - the validated registration data
	 * @returns the id of the newly created user
	 */
	async register(data: {
		email: string;
		firstName: string;
		lastName: string;
		password: string;
		repeatPassword?: string;
		weight: number;
		height: number;
		birthDate: number;
		dailyCalorieGoal: number;
		dailyProteinGoal: number;
		dailyFatGoal: number;
		dailyCarbsGoal: number;
		securityQuestionKey: SecurityQuestionKey;
		securityAnswer: string;
	}): Promise<{ id: string; token: string }> {
		const available = await this.isEmailAvailable(data.email);
		if (!available) {
			throw new EmailAlreadyInUseError();
		}
		if (data.repeatPassword !== undefined && data.password !== data.repeatPassword) {
			throw new PasswordConfirmationError();
		}

		this.assertPasswordPolicy(data.password, {
			email: data.email,
			firstName: data.firstName,
			lastName: data.lastName
		});

		const now = Date.now();
		const userId = uuidv4();

		const user: User = {
			id: userId,
			email: data.email,
			createdAt: now,
			firstName: data.firstName,
			lastName: data.lastName,
			role: 'user',
			password: await hashPassword(data.password),
			securityQuestionKey: data.securityQuestionKey,
			securityAnswerHash: await hashPassword(normalizeSecurityAnswer(data.securityAnswer)),
			isDeactivated: false
		};

		const stats: UserStats = {
			id: uuidv4(),
			createdAt: now,
			userId,
			weight: data.weight,
			height: data.height,
			birthDate: data.birthDate,
			dailyCalorieGoal: data.dailyCalorieGoal,
			dailyProteinGoal: data.dailyProteinGoal,
			dailyFatGoal: data.dailyFatGoal,
			dailyCarbsGoal: data.dailyCarbsGoal
		};

		const id = await this.userDao.createNewUser(user, stats);

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) throw new Error('JWT_SECRET environment variable is not set');
		const token = jwt.sign({ id, email: data.email, role: 'user' }, jwtSecret, {
			expiresIn: config.jwt.expiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`
		});

		return { id, token };
	}

	/**
	 * Verifies credentials and returns a signed JWT on success.
	 * @param email - the user's email
	 * @param password - the plain-text password to verify
	 * @returns a signed JWT string
	 * @throws InvalidCredentialsError if email not found or password is wrong
	 */
	async login(email: string, password: string): Promise<{ token: string; userId: string }> {
		const user = await this.userDao.getByEmail(email);
		if (!user) {
			throw new InvalidCredentialsError();
		}

		const match = await verifyPassword(password, user.password);
		if (!match) {
			throw new InvalidCredentialsError();
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) throw new Error('JWT_SECRET environment variable is not set');
		const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, {
			expiresIn: config.jwt.expiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`
		});

		return { token, userId: user.id };
	}

	/**
	 * Verifies the current password and replaces it with a hashed new password.
	 * @param userId - the UUID of the user
	 * @param currentPassword - the plain-text current password to verify
	 * @param newPassword - the plain-text new password to hash and store
	 * @param repeatPassword - repeated new password from the client
	 * @throws UserNotFoundError if the user does not exist
	 * @throws InvalidCredentialsError if currentPassword does not match
	 */
	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
		repeatPassword: string
	): Promise<void> {
		const user = await this.userDao.getById(userId);
		if (!user) {
			throw new UserNotFoundError();
		}

		const match = await verifyPassword(currentPassword, user.password);
		if (!match) {
			throw new InvalidCredentialsError();
		}
		if (newPassword !== repeatPassword) {
			throw new PasswordConfirmationError();
		}

		this.assertPasswordPolicy(newPassword, {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName
		});

		const hashed = await hashPassword(newPassword);
		await this.userDao.changePassword(userId, hashed);
	}

	/**
	 * Handles request password reset.
	 * @param {string} email email.
	 * @returns {Promise<{ questionKey: SecurityQuestionKey; question: string } | null>} The security question for the
	 * account, or `null` when no account exists for the email (anti-enumeration).
	 * @throws {SecurityQuestionNotSetError} When the account exists but has no (valid) security question set up.
	 */
	async requestPasswordReset(email: string): Promise<{ questionKey: SecurityQuestionKey; question: string } | null> {
		const user = await this.userDao.getByEmail(email);
		if (!user) {
			return null;
		}

		if (!user.securityQuestionKey || !user.securityAnswerHash || !isSecurityQuestionKey(user.securityQuestionKey)) {
			throw new SecurityQuestionNotSetError();
		}

		return {
			questionKey: user.securityQuestionKey,
			question: SECURITY_QUESTIONS[user.securityQuestionKey]
		};
	}

	/**
	 * Verifies a security answer and creates a password-reset token.
	 * @param {string} email email.
	 * @param {string} answer answer.
	 * @returns {Promise<string>} A promise resolving to the reset token.
	 * @throws {SecurityAnswerError} When the account or answer cannot be verified.
	 * @throws {TooManySecurityAnswerAttemptsError} When too many attempts were made.
	 */
	async verifySecurityAnswer(email: string, answer: string): Promise<string> {
		const user = await this.userDao.getByEmail(email);
		if (!user?.securityAnswerHash) {
			throw new SecurityAnswerError();
		}

		const now = Date.now();
		const recentFailures = await this.userDao.countRecentFailedSecurityAnswers(user.id, now - 15 * 60 * 1000);
		if (recentFailures >= 5) {
			throw new TooManySecurityAnswerAttemptsError();
		}

		const matches = await verifyPassword(normalizeSecurityAnswer(answer), user.securityAnswerHash);
		if (!matches) {
			await this.userDao.createFailedSecurityAnswerAttempt(uuidv4(), user.id, now);
			throw new SecurityAnswerError();
		}

		const { token, tokenHash } = createPasswordResetToken();
		await this.userDao.createPasswordResetToken({
			id: uuidv4(),
			userId: user.id,
			tokenHash,
			expiresAt: Date.now() + 15 * 60 * 1000,
			createdAt: Date.now()
		});
		return token;
	}

	/**
	 * Handles reset password.
	 * @param {string} token token.
	 * @param {string} newPassword new password.
	 * @param {string} repeatPassword repeat password.
	 * @throws {Error} When validation fails or the operation cannot be completed.
	 */
	async resetPassword(token: string, newPassword: string, repeatPassword: string): Promise<string> {
		if (newPassword !== repeatPassword) {
			throw new PasswordConfirmationError();
		}

		const tokenHash = hashResetToken(token);
		const resetToken = await this.userDao.getValidPasswordResetToken(tokenHash, Date.now());
		if (!resetToken) {
			throw new InvalidResetTokenError();
		}

		const user = await this.userDao.getById(resetToken.userId);
		if (!user) {
			throw new InvalidResetTokenError();
		}

		this.assertPasswordPolicy(newPassword, {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName
		});

		const markedUsed = await this.userDao.markPasswordResetTokenUsed(resetToken.id, Date.now());
		if (!markedUsed) {
			throw new InvalidResetTokenError();
		}

		await this.userDao.changePassword(user.id, await hashPassword(newPassword));
		return user.id;
	}

	/**
	 * Asserts that password policy is valid.
	 * @param {string} password password.
	 * @param {{ email?: string; firstName?: string; lastName?: string }} context context.
	 * @throws {Error} When validation fails or the operation cannot be completed.
	 */
	private assertPasswordPolicy(password: string, context: { email?: string; firstName?: string; lastName?: string }) {
		const policyResult = validatePasswordPolicy(password, context);
		if (!policyResult.valid) {
			const errors = [...policyResult.errors];
			if (password.length >= 8 && password.length < passwordPolicy.minLength && errors.length > 1) {
				errors.push(errors.shift()!);
			}
			throw new PasswordPolicyError(errors);
		}
	}
}

/**
 * Checks whether a value is a supported security question key.
 * @param {string} key key.
 * @returns {key is SecurityQuestionKey} The operation result.
 */
function isSecurityQuestionKey(key: string): key is SecurityQuestionKey {
	return Object.hasOwn(SECURITY_QUESTIONS, key);
}
