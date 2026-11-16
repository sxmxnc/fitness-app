/**
 * Autor: Luca Lammers

 */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

/** Describes the password context shape. */
export type PasswordContext = {
	email?: string;
	firstName?: string;
	lastName?: string;
};

/** Describes the password policy config shape. */
export type PasswordPolicyConfig = {
	minLength: number;
	requireLowercase: boolean;
	requireUppercase: boolean;
	requireDigit: boolean;
	requireSpecialChar: boolean;
	rejectCommonPasswords: boolean;
	rejectObviousPatterns: boolean;
};

/** Describes the password policy result shape. */
export type PasswordPolicyResult = {
	valid: boolean;
	errors: string[];
	score: number;
};

export const passwordPolicy: PasswordPolicyConfig = {
	minLength: Number.parseInt(process.env.PASSWORD_MIN_LENGTH ?? '12', 10),
	requireLowercase: true,
	requireUppercase: true,
	requireDigit: true,
	requireSpecialChar: true,
	rejectCommonPasswords: true,
	rejectObviousPatterns: true
};

const bcryptCost = Number.parseInt(process.env.PASSWORD_BCRYPT_COST ?? '12', 10);

const commonPasswords = new Set([
	'password',
	'passwort',
	'123456',
	'123456789',
	'qwertz',
	'qwerty',
	'admin',
	'letmein',
	'welcome',
	'iloveyou',
	'!!p4$$w0ord',
	'p4ssw0rd',
	'passwort1!',
	'password1!',
	'admin123'
]);

/**
 * Validates password policy.
 * @param {string} password password.
 * @param {PasswordContext} context context.
 * @param {PasswordPolicyConfig} policy policy.
 * @returns {PasswordPolicyResult} The operation result.
 */
export function validatePasswordPolicy(
	password: string,
	context: PasswordContext = {},
	policy: PasswordPolicyConfig = passwordPolicy
): PasswordPolicyResult {
	const normalized = password.normalize('NFC');
	const lower = normalized.toLowerCase();
	const leetNormalized = normalizeLeetspeak(lower);
	const errors: string[] = [];

	if (normalized.length < policy.minLength) {
		errors.push('Das Passwort ist zu kurz.');
	}
	if (policy.requireLowercase && !/[a-z]/.test(normalized)) {
		errors.push('Das Passwort erfüllt die Passwortrichtlinie nicht.');
	}
	if (policy.requireUppercase && !/[A-ZÄÖÜ]/.test(normalized)) {
		errors.push('Das Passwort erfüllt die Passwortrichtlinie nicht.');
	}
	if (policy.requireDigit && !/\d/.test(normalized)) {
		errors.push('Das Passwort erfüllt die Passwortrichtlinie nicht.');
	}
	if (policy.requireSpecialChar && !/[^a-zA-Z0-9ÄÖÜäöüß]/.test(normalized)) {
		errors.push('Das Passwort erfüllt die Passwortrichtlinie nicht.');
	}
	if (policy.rejectCommonPasswords && isCommonPassword(lower, leetNormalized)) {
		errors.push('Das Passwort ist zu häufig verwendet.');
	}
	if (policy.rejectObviousPatterns && hasObviousPattern(lower, leetNormalized, context)) {
		errors.push('Das Passwort darf keine leicht erratbaren Muster enthalten.');
	}

	const uniqueErrors = [...new Set(errors)];
	return {
		valid: uniqueErrors.length === 0,
		errors: uniqueErrors,
		score: calculatePolicyScore(normalized, uniqueErrors.length)
	};
}

/**
 * Checks whether hash password is true.
 * @param {string} password password.
 * @returns {Promise<string>} A promise resolving to the operation result.
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, bcryptCost);
}

/**
 * Verifies password.
 * @param {string} password password.
 * @param {string} hash hash.
 * @returns {Promise<boolean>} A promise resolving to the operation result.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

/**
 * Normalizes a security answer before hashing or verification.
 * @param {string} answer answer.
 * @returns {string} The operation result.
 */
export function normalizeSecurityAnswer(answer: string): string {
	return answer.normalize('NFC').trim().toLowerCase();
}

/**
 * Creates password reset token.
 * @returns {{ token: string; tokenHash: string }} The operation result.
 */
export function createPasswordResetToken(): { token: string; tokenHash: string } {
	const token = crypto.randomBytes(32).toString('base64url');
	return { token, tokenHash: hashResetToken(token) };
}

/**
 * Checks whether hash reset token is true.
 * @param {string} token token.
 * @returns {string} The operation result.
 */
export function hashResetToken(token: string): string {
	return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Checks whether is common password is true.
 * @param {string} lower lower.
 * @param {string} leetNormalized leet normalized.
 * @returns {boolean} The operation result.
 */
function isCommonPassword(lower: string, leetNormalized: string): boolean {
	return commonPasswords.has(lower) || commonPasswords.has(leetNormalized);
}

/**
 * Handles normalize leetspeak.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
function normalizeLeetspeak(value: string): string {
	return value.replace(/[@4]/g, 'a').replace(/[!1|]/g, 'i').replace(/0/g, 'o').replace(/\$/g, 's');
}

/**
 * Checks whether has obvious pattern is true.
 * @param {string} lower lower.
 * @param {string} leetNormalized leet normalized.
 * @param {PasswordContext} context context.
 * @returns {boolean} The operation result.
 */
function hasObviousPattern(lower: string, leetNormalized: string, context: PasswordContext): boolean {
	const contextParts = [context.email?.split('@')[0], context.firstName, context.lastName]
		.filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {string} part part.
			 * @returns {part is string} The operation result.
			 */
			(part): part is string => Boolean(part)
		)
		.map(
			/**
			 * Transforms one item while building the derived collection.
			 * @param {string} part part.
			 * @returns {string} The operation result.
			 */
			part => normalizeLeetspeak(part.toLowerCase())
		)
		.filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {string} part part.
			 * @returns {boolean} The operation result.
			 */
			part => part.length >= 3
		);

	return (
		/(.)\1{5,}/.test(lower) ||
		/(?:0123|1234|123456|234567|345678|abcdef|abc123|qwerty|qwertz|password|passwort)/.test(leetNormalized) ||
		/(?:19|20)\d{2}/.test(lower) ||
		contextParts.some(
			/**
			 * Checks whether one item satisfies the requested condition.
			 * @param {string} part part.
			 * @returns {boolean} The operation result.
			 */
			part => leetNormalized.includes(part)
		)
	);
}

/**
 * Calculates policy score.
 * @param {string} password password.
 * @param {number} errorCount error count.
 * @returns {number} The operation result.
 */
function calculatePolicyScore(password: string, errorCount: number): number {
	if (password.length === 0) return 0;
	const variety = [
		/[a-z]/.test(password),
		/[A-ZÄÖÜ]/.test(password),
		/\d/.test(password),
		/[^a-zA-Z0-9ÄÖÜäöüß]/.test(password)
	].filter(Boolean).length;
	const lengthBonus = password.length >= 16 ? 1 : 0;
	return Math.max(0, Math.min(4, variety + lengthBonus - errorCount));
}
