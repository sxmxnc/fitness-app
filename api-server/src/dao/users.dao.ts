/**
 * Autor: Luca Lammers

 */
import { Pool, PoolClient } from 'pg';
import { User } from '../models/user_entitys/user.js';
import { UserData } from '../models/user_entitys/user_data.js';
import { UserStats } from '../models/user_entitys/user_stats.js';
import { decrypt, encrypt } from '../utils/crypto.util.js';
import { createLookupHash } from '../utils/mac.util.js';

/**
 * Users are not getting deleted bc there is no benefit instead we deactivate(normally a DSGVO thing but lets keep them)
 */

/** Describes the password reset token shape. */
export type PasswordResetToken = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: number;
	createdAt: number;
	usedAt: number | null;
};

/** Provides database access methods for user. */
export class UserDao {
	private static readonly ALLOWED_PROFILE_FIELDS = new Set(['firstName', 'lastName', 'email']);
	private static readonly ALLOWED_GOALS_FIELDS = new Set([
		'weight',
		'height',
		'birthDate',
		'dailyCalorieGoal',
		'dailyProteinGoal',
		'dailyFatGoal',
		'dailyCarbsGoal'
	]);
	private static readonly ENCRYPTED_USER_FIELDS = ['email', 'firstName', 'lastName'] as const;
	private static readonly ENCRYPTED_STATS_FIELDS = [
		'weight',
		'height',
		'birthDate',
		'dailyCalorieGoal',
		'dailyProteinGoal',
		'dailyFatGoal',
		'dailyCarbsGoal'
	] as const;

	/**
	 * Creates a new user dao instance.
	 * @param {Pool} client client.
	 */
	constructor(private readonly client: Pool) {}

	/** Ensures profile columns can store encrypted values and migrates existing plaintext rows. */
	async ensureEncryptedProfileStorage(): Promise<void> {
		await this.client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailHash" VARCHAR(64) UNIQUE');
		await this.client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "securityQuestionKey" VARCHAR(64)');
		await this.client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "securityAnswerHash" VARCHAR(255)');
		await this.client.query(
			'CREATE TABLE IF NOT EXISTS password_reset_tokens ("id" VARCHAR(36) PRIMARY KEY, "userId" VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE, "tokenHash" VARCHAR(64) NOT NULL UNIQUE, "createdAt" BIGINT NOT NULL, "expiresAt" BIGINT NOT NULL, "usedAt" BIGINT DEFAULT NULL)'
		);
		await this.client.query(
			'CREATE TABLE IF NOT EXISTS password_reset_attempts ("id" VARCHAR(36) PRIMARY KEY, "userId" VARCHAR(36) NOT NULL REFERENCES users("id") ON DELETE CASCADE, "createdAt" BIGINT NOT NULL)'
		);
		await this.client.query('ALTER TABLE users ALTER COLUMN "email" TYPE TEXT');
		await this.client.query('ALTER TABLE users ALTER COLUMN "firstName" TYPE TEXT');
		await this.client.query('ALTER TABLE users ALTER COLUMN "lastName" TYPE TEXT');

		for (const field of UserDao.ENCRYPTED_STATS_FIELDS) {
			await this.client.query(`ALTER TABLE user_stats ALTER COLUMN "${field}" TYPE TEXT USING "${field}"::TEXT`);
		}

		await this.encryptExistingPlainProfileData();
	}

	/**
	 * retrieves only the user information stored in the database
	 * @param email - the email of the user
	 * @returns the user or null if not found
	 */
	async getByEmail(email: string): Promise<User | null> {
		const result = await this.client.query(
			'SELECT * FROM users WHERE "emailHash" = $1 AND "isDeactivated" = FALSE',
			[hashEmailForLookup(email)]
		);
		return this.decryptUserRow(result.rows[0]);
	}

	/**
	 * Retrieves by id.
	 * @param {string} id id.
	 * @returns {Promise<User | null>} A promise resolving to the operation result.
	 */
	async getById(id: string): Promise<User | null> {
		const result = await this.client.query('SELECT * FROM users WHERE "id" = $1 AND "isDeactivated" = FALSE', [id]);
		return this.decryptUserRow(result.rows[0]);
	}

	/**
	 * retrieves User with user data
	 * @param id - the UUID of the user
	 * @returns the user + user_stats or null if not found
	 */
	async getUserData(id: string): Promise<UserData | null> {
		const result = await this.client.query(
			'SELECT u."id", u."createdAt", u."email", u."firstName", u."lastName", u."role", u."isDeactivated", us."userId", us."weight", us."height", us."birthDate", us."dailyCalorieGoal", us."dailyProteinGoal", us."dailyFatGoal", us."dailyCarbsGoal" FROM users u JOIN user_stats us ON us."userId" = u."id" WHERE u."id" = $1 AND u."isDeactivated" = FALSE',
			[id]
		);
		return this.decryptUserDataRow(result.rows[0]);
	}

	/**
	 * retrieves only the password hash for a given user id
	 * @param id - the UUID of the user
	 * @returns the bcrypt password hash or null if not found
	 */
	async getPasswordHash(id: string): Promise<string | null> {
		const result = await this.client.query(
			'SELECT "password" FROM users WHERE "id" = $1 AND "isDeactivated" = FALSE',
			[id]
		);
		return (result.rows[0]?.password as string) ?? null;
	}

	/**
	 * creates a new user and their stats in a transaction
	 * @param user - the user to create
	 * @param stats - the user stats to create
	 * @returns the id of the newly created user
	 */
	async createNewUser(user: User, stats: UserStats): Promise<string> {
		const client: PoolClient = await this.client.connect();
		try {
			await client.query('BEGIN');
			await client.query(
				'INSERT INTO users ("id", "email", "emailHash", "createdAt", "firstName", "lastName", "role", "password", "securityQuestionKey", "securityAnswerHash", "isDeactivated") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
				[
					user.id,
					encrypt(user.email),
					hashEmailForLookup(user.email),
					user.createdAt,
					encrypt(user.firstName),
					encrypt(user.lastName),
					user.role,
					user.password,
					user.securityQuestionKey,
					user.securityAnswerHash,
					user.isDeactivated
				]
			);
			await this.createUserStats(client, stats);
			await client.query('COMMIT');
			return user.id;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}

	/**
	 * updates the user status isDeactivated to true
	 * @param id - the UUID of the user
	 * @returns true if a user was deactivated, false if not found
	 */
	async deactivateUser(id: string): Promise<boolean> {
		const result = await this.client.query(
			'UPDATE users SET "isDeactivated" = TRUE WHERE "id" = $1 AND "isDeactivated" = FALSE',
			[id]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Changes role.
	 * @param {string} id id.
	 * @param {'user' | 'admin'} role role.
	 * @returns {Promise<boolean>} A promise resolving to the operation result.
	 */
	async changeRole(id: string, role: 'user' | 'admin'): Promise<boolean> {
		const result = await this.client.query(
			'UPDATE users SET "role" = $1 WHERE "id" = $2 AND "isDeactivated" = FALSE',
			[role, id]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * updates firstName, lastName and/or email of a user
	 * @param id - the UUID of the user
	 * @param changes - the fields to update (at least one required)
	 * @returns true if a user was updated, false if not found
	 */
	async updateProfileData(
		id: string,
		changes: { firstName?: string; lastName?: string; email?: string }
	): Promise<boolean> {
		const fields: [string, string][] = [];
		for (const [key, value] of Object.entries(changes)) {
			if (!UserDao.ALLOWED_PROFILE_FIELDS.has(key)) throw new Error(`Invalid field: ${key}`);
			if (value !== undefined) fields.push([key, encrypt(value)]);
		}
		if (changes.email !== undefined) {
			fields.push(['emailHash', hashEmailForLookup(changes.email)]);
		}
		if (fields.length === 0) throw new Error('No fields to update');

		const setClauses = fields
			.map(
				/**
				 * Transforms one item while building the derived collection.
				 * @param {[string, string]} [key] [key].
				 * @param {number} i i.
				 * @returns {string} The operation result.
				 */
				([key], i) => `"${key}" = $${i + 1}`
			)
			.join(', ');
		const values = [
			...fields.map(
				/**
				 * Transforms one item while building the derived collection.
				 * @param {[string, string]} [, val] [, val].
				 * @returns {string} The operation result.
				 */
				([, val]) => val
			),
			id
		];

		const { rowCount } = await this.client.query(
			`UPDATE users SET ${setClauses} WHERE "id" = $${fields.length + 1} AND "isDeactivated" = FALSE`,
			values
		);
		return rowCount !== null && rowCount > 0;
	}

	/**
	 * updates the user_stats row for a given user
	 * @param userId - the UUID of the user
	 * @param changes - the fields to update (at least one required)
	 * @returns true if stats were updated, false if not found
	 */
	async updateGoals(
		userId: string,
		changes: {
			weight?: number;
			height?: number;
			birthDate?: number;
			dailyCalorieGoal?: number;
			dailyProteinGoal?: number;
			dailyFatGoal?: number;
			dailyCarbsGoal?: number;
		}
	): Promise<boolean> {
		const fields: [string, string][] = [];
		for (const [key, value] of Object.entries(changes)) {
			if (!UserDao.ALLOWED_GOALS_FIELDS.has(key)) throw new Error(`Invalid field: ${key}`);
			if (value !== undefined) fields.push([key, encrypt(String(value))]);
		}
		if (fields.length === 0) throw new Error('No fields to update');

		const setClauses = fields
			.map(
				/**
				 * Transforms one item while building the derived collection.
				 * @param {[string, number]} [key] [key].
				 * @param {number} i i.
				 * @returns {string} The operation result.
				 */
				([key], i) => `"${key}" = $${i + 1}`
			)
			.join(', ');
		const values = [
			...fields.map(
				/**
				 * Transforms one item while building the derived collection.
				 * @param {[string, number]} [, val] [, val].
				 * @returns {number} The operation result.
				 */
				([, val]) => val
			),
			userId
		];

		const { rowCount } = await this.client.query(
			`UPDATE user_stats SET ${setClauses} WHERE "userId" = $${fields.length + 1}`,
			values
		);
		return rowCount !== null && rowCount > 0;
	}

	/**
	 * replaces the stored password hash for a user
	 * @param userId - the UUID of the user
	 * @param hashedPassword - the new bcrypt hash to store
	 * @returns true if updated, false if user not found
	 */
	async changePassword(userId: string, hashedPassword: string): Promise<boolean> {
		const { rowCount } = await this.client.query(
			'UPDATE users SET "password" = $1 WHERE "id" = $2 AND "isDeactivated" = FALSE',
			[hashedPassword, userId]
		);
		return rowCount !== null && rowCount > 0;
	}

	/**
	 * Creates password reset token.
	 * @param {Omit<PasswordResetToken, 'usedAt'>} token token.
	 */
	async createPasswordResetToken(token: Omit<PasswordResetToken, 'usedAt'>): Promise<void> {
		await this.client.query(
			'INSERT INTO password_reset_tokens ("id", "userId", "tokenHash", "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, $5)',
			[token.id, token.userId, token.tokenHash, token.expiresAt, token.createdAt]
		);
	}

	/**
	 * Retrieves valid password reset token.
	 * @param {string} tokenHash token hash.
	 * @param {number} now now.
	 * @returns {Promise<PasswordResetToken | null>} A promise resolving to the operation result.
	 */
	async getValidPasswordResetToken(tokenHash: string, now: number): Promise<PasswordResetToken | null> {
		const result = await this.client.query(
			'SELECT * FROM password_reset_tokens WHERE "tokenHash" = $1 AND "usedAt" IS NULL AND "expiresAt" >= $2',
			[tokenHash, now]
		);
		return (result.rows[0] as PasswordResetToken) ?? null;
	}

	/**
	 * Marks password reset token used.
	 * @param {string} id id.
	 * @param {number} usedAt used at.
	 * @returns {Promise<boolean>} A promise resolving to the operation result.
	 */
	async markPasswordResetTokenUsed(id: string, usedAt: number): Promise<boolean> {
		const result = await this.client.query(
			'UPDATE password_reset_tokens SET "usedAt" = $1 WHERE "id" = $2 AND "usedAt" IS NULL',
			[usedAt, id]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Counts recently failed password reset tokens for a user.
	 * @param {string} userId user id.
	 * @param {number} since lower timestamp boundary.
	 * @returns {Promise<number>} A promise resolving to the operation result.
	 */
	async countRecentFailedSecurityAnswers(userId: string, since: number): Promise<number> {
		const result = await this.client.query(
			'SELECT COUNT(*)::int AS count FROM password_reset_attempts WHERE "userId" = $1 AND "createdAt" >= $2',
			[userId, since]
		);
		return result.rows[0]?.count as number;
	}

	/**
	 * Stores a failed security-answer attempt.
	 * @param {string} id id.
	 * @param {string} userId user id.
	 * @param {number} createdAt created at.
	 */
	async createFailedSecurityAnswerAttempt(id: string, userId: string, createdAt: number): Promise<void> {
		await this.client.query(
			'INSERT INTO password_reset_attempts ("id", "userId", "createdAt") VALUES ($1, $2, $3)',
			[id, userId, createdAt]
		);
	}

	/**
	 * retrieves all non-admin users (including deactivated ones) for the admin overview
	 * @returns list of users with id, firstName, lastName, email, createdAt, isDeactivated
	 */
	async getAllNonAdminUsers(): Promise<
		{ id: string; firstName: string; lastName: string; email: string; createdAt: number; isDeactivated: boolean }[]
	> {
		const result = await this.client.query(
			'SELECT "id", "firstName", "lastName", "email", "createdAt", "isDeactivated" FROM users WHERE "role" != \'admin\' ORDER BY "createdAt" DESC'
		);
		return result.rows.map(row => ({
			...row,
			email: decryptStringField(row.email),
			firstName: decryptStringField(row.firstName),
			lastName: decryptStringField(row.lastName)
		}));
	}

	/**
	 * reactivates a previously deactivated user
	 * @param id - the UUID of the user
	 * @returns true if the user was reactivated, false if not found or already active
	 */
	async reactivateUser(id: string): Promise<boolean> {
		const result = await this.client.query(
			'UPDATE users SET "isDeactivated" = FALSE WHERE "id" = $1 AND "isDeactivated" = TRUE',
			[id]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Retrieves non admin count.
	 * @returns {Promise<number>} A promise resolving to the operation result.
	 */
	async getNonAdminCount(): Promise<number> {
		const result = await this.client.query(
			'SELECT COUNT(*) as count FROM users WHERE "role" != \'admin\' AND "isDeactivated" = FALSE'
		);
		return Number.parseInt(result.rows[0].count, 10);
	}

	/**
	 * Retrieves registered user count in timeframe.
	 * @param {{ from?: number; to?: number }} range range.
	 * @returns {Promise<number>} A promise resolving to the operation result.
	 */
	async getRegisteredUserCountInTimeframe(range: { from?: number; to?: number }): Promise<number> {
		const conditions: string[] = ['"role" != \'admin\'', '"isDeactivated" = FALSE'];
		const values: number[] = [];
		if (range.from !== undefined) {
			values.push(range.from);
			conditions.push(`"createdAt" >= $${values.length}`);
		}
		if (range.to !== undefined) {
			values.push(range.to);
			conditions.push(`"createdAt" <= $${values.length}`);
		}
		const result = await this.client.query(
			`SELECT COUNT(*)::int AS count FROM users WHERE ${conditions.join(' AND ')}`,
			values
		);
		return result.rows[0].count as number;
	}

	/**
	 * creates the user_stats row for a given user
	 * @param client - the dedicated pool client for the transaction
	 * @param stats - the user stats to insert
	 */
	private async createUserStats(client: PoolClient, stats: UserStats): Promise<void> {
		await client.query(
			'INSERT INTO user_stats ("id", "createdAt", "userId", "weight", "height", "birthDate", "dailyCalorieGoal", "dailyProteinGoal", "dailyFatGoal", "dailyCarbsGoal") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
			[
				stats.id,
				stats.createdAt,
				stats.userId,
				encryptNullableNumber(stats.weight),
				encryptNullableNumber(stats.height),
				encryptNullableNumber(stats.birthDate),
				encryptNullableNumber(stats.dailyCalorieGoal),
				encryptNullableNumber(stats.dailyProteinGoal),
				encryptNullableNumber(stats.dailyFatGoal),
				encryptNullableNumber(stats.dailyCarbsGoal)
			]
		);
	}

	/**
	 * Migrates existing plaintext profile data to encrypted storage.
	 */
	private async encryptExistingPlainProfileData(): Promise<void> {
		const users = await this.client.query('SELECT "id", "email", "firstName", "lastName" FROM users');
		for (const row of users.rows) {
			const email = decryptStringField(row.email);
			await this.client.query(
				'UPDATE users SET "email" = $1, "emailHash" = $2, "firstName" = $3, "lastName" = $4 WHERE "id" = $5',
				[
					ensureEncryptedString(row.email),
					hashEmailForLookup(email),
					ensureEncryptedString(row.firstName),
					ensureEncryptedString(row.lastName),
					row.id
				]
			);
		}

		const stats = await this.client.query(
			'SELECT "id", "weight", "height", "birthDate", "dailyCalorieGoal", "dailyProteinGoal", "dailyFatGoal", "dailyCarbsGoal" FROM user_stats'
		);
		for (const row of stats.rows) {
			await this.client.query(
				'UPDATE user_stats SET "weight" = $1, "height" = $2, "birthDate" = $3, "dailyCalorieGoal" = $4, "dailyProteinGoal" = $5, "dailyFatGoal" = $6, "dailyCarbsGoal" = $7 WHERE "id" = $8',
				[
					ensureEncryptedNullable(row.weight),
					ensureEncryptedNullable(row.height),
					ensureEncryptedNullable(row.birthDate),
					ensureEncryptedNullable(row.dailyCalorieGoal),
					ensureEncryptedNullable(row.dailyProteinGoal),
					ensureEncryptedNullable(row.dailyFatGoal),
					ensureEncryptedNullable(row.dailyCarbsGoal),
					row.id
				]
			);
		}
	}

	/**
	 * Decrypts a user row returned by PostgreSQL.
	 * @param {unknown} row row.
	 * @returns {User | null} The operation result.
	 */
	private decryptUserRow(row: unknown): User | null {
		if (!row) return null;
		const user = row as User;
		return {
			...user,
			email: decryptStringField(user.email),
			firstName: decryptStringField(user.firstName),
			lastName: decryptStringField(user.lastName)
		};
	}

	/**
	 * Decrypts a joined user/profile row returned by PostgreSQL.
	 * @param {unknown} row row.
	 * @returns {UserData | null} The operation result.
	 */
	private decryptUserDataRow(row: unknown): UserData | null {
		if (!row) return null;
		const userData = row as UserData;
		return {
			...userData,
			email: decryptStringField(userData.email),
			firstName: decryptStringField(userData.firstName),
			lastName: decryptStringField(userData.lastName),
			weight: decryptNullableNumber(userData.weight),
			height: decryptNullableNumber(userData.height),
			birthDate: decryptNullableNumber(userData.birthDate),
			dailyCalorieGoal: decryptNullableNumber(userData.dailyCalorieGoal),
			dailyProteinGoal: decryptNullableNumber(userData.dailyProteinGoal),
			dailyFatGoal: decryptNullableNumber(userData.dailyFatGoal),
			dailyCarbsGoal: decryptNullableNumber(userData.dailyCarbsGoal)
		};
	}
}

/**
 * Normalizes an email for deterministic lookup hashing.
 * @param {string} email email.
 * @returns {string} The operation result.
 */
function normalizeEmailForLookup(email: string): string {
	return email.normalize('NFC').trim().toLowerCase();
}

/**
 * Hashes an email for database lookup.
 * @param {string} email email.
 * @returns {string} The operation result.
 */
function hashEmailForLookup(email: string): string {
	return createLookupHash(normalizeEmailForLookup(email));
}

/**
 * Encrypts a nullable number as string data.
 * @param {number | null} value value.
 * @returns {string | null} The operation result.
 */
function encryptNullableNumber(value: number | null): string | null {
	return value === null ? null : encrypt(String(value));
}

/**
 * Decrypts a string field, keeping plaintext compatibility for existing rows.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
function decryptStringField(value: string): string {
	try {
		return decrypt(value);
	} catch {
		return value;
	}
}

/**
 * Decrypts an optional numeric field.
 * @param {unknown} value value.
 * @returns {number | null} The operation result.
 */
function decryptNullableNumber(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	const decrypted = decryptStringField(String(value));
	const parsed = Number(decrypted);
	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Encrypts a non-null field when it is not already encrypted.
 * @param {string | null} value value.
 * @returns {string | null} The operation result.
 */
function ensureEncryptedNullable(value: string | null): string | null {
	if (value === null) {
		return null;
	}

	return ensureEncryptedString(value);
}

/**
 * Encrypts a string when it is not already encrypted.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
function ensureEncryptedString(value: string): string {
	try {
		decrypt(value);
		return value;
	} catch {
		return encrypt(value);
	}
}
