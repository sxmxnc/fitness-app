/**
 * Autor: Luca Lammers

 */
import { Pool } from 'pg';
import { UserSessions } from '../models/user_entitys/user_session.js';

/** Provides database access methods for session. */
export class SessionDao {
	/**
	 * Creates a new session dao instance.
	 * @param {Pool} client client.
	 */
	constructor(private readonly client: Pool) {}

	/**
	 * Retrieves user sessions.
	 * @param {string} id id.
	 * @returns {Promise<UserSessions[]>} A promise resolving to the operation result.
	 */
	async getUserSessions(id: string) {
		const result = await this.client.query('SELECT * FROM user_sessions WHERE "userId" = $1', [id]);
		return result.rows as UserSessions[];
	}

	/**
	 * Retrieves completed sessions by day.
	 * @param {{ from?: number; to?: number }} range range.
	 * @returns {Promise<{ day: string; count: number }[]>} A promise resolving to the operation result.
	 */
	async getCompletedSessionsByDay(range: { from?: number; to?: number }): Promise<{ day: string; count: number }[]> {
		const conditions: string[] = ['"isFinished" = TRUE'];
		const values: number[] = [];

		if (range.from !== undefined) {
			values.push(range.from);
			conditions.push(`"startedAt" >= $${values.length}`);
		}
		if (range.to !== undefined) {
			values.push(range.to);
			conditions.push(`"finishedAt" <= $${values.length}`);
		}

		const result = await this.client.query(
			`SELECT TO_CHAR(TO_TIMESTAMP("startedAt" / 1000), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
			 FROM user_sessions
			 WHERE ${conditions.join(' AND ')}
			 GROUP BY day
			 ORDER BY day`,
			values
		);
		return result.rows as { day: string; count: number }[];
	}

	/**
	 * Retrieves user activity by day.
	 * @param {string} id id.
	 * @param {{ from?: number; to?: number }} range range.
	 * @returns {Promise<{ day: string; count: number }[]>} A promise resolving to the operation result.
	 */
	async getUserActivityByDay(
		id: string,
		range: { from?: number; to?: number }
	): Promise<{ day: string; count: number }[]> {
		const conditions: string[] = [];
		const values: (number | string)[] = [];

		if (range.from !== undefined) {
			values.push(range.from);
			conditions.push(`"startedAt" >= $${values.length}`);
		}

		if (range.to !== undefined) {
			values.push(range.to);
			conditions.push(`"startedAt" <= $${values.length}`);
		}

		values.push(id);
		const userIdCondition = `"userId" = $${values.length}`;

		const whereClause =
			conditions.length > 0 ? `${conditions.join(' AND ')} AND ${userIdCondition}` : userIdCondition;

		const result = await this.client.query(
			`
			SELECT TO_CHAR(TO_TIMESTAMP("startedAt" / 1000), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
			FROM user_sessions
			WHERE ${whereClause}
			GROUP BY day
			ORDER BY day
		`,
			values
		);

		return result.rows as { day: string; count: number }[];
	}

	/**
	 * Retrieves active user count in timeframe.
	 * @param {{ from?: number; to?: number }} range range.
	 * @returns {Promise<number>} A promise resolving to the operation result.
	 */
	async getActiveUserCountInTimeframe(range: { from?: number; to?: number }): Promise<number> {
		const conditions: string[] = [];
		const values: number[] = [];
		if (range.from !== undefined) {
			values.push(range.from);
			conditions.push(`"startedAt" >= $${values.length}`);
		}
		if (range.to !== undefined) {
			values.push(range.to);
			conditions.push(`"startedAt" <= $${values.length}`);
		}
		const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
		const result = await this.client.query(
			`SELECT COUNT(DISTINCT "userId")::int AS count FROM user_sessions ${where}`,
			values
		);
		return result.rows[0].count as number;
	}

	/**
	 * Starts session.
	 * @param {string} id id.
	 * @param {string} userId user id.
	 * @param {number} startedAt started at.
	 */
	async startSession(id: string, userId: string, startedAt: number) {
		await this.client.query('INSERT INTO user_sessions ("id", "userId", "startedAt") VALUES($1, $2, $3)', [
			id,
			userId,
			startedAt
		]);
	}

	/**
	 * Handles finish user sessions.
	 * @param {string} userId user id.
	 * @param {number} finishedAt finished at.
	 * @returns {Promise<boolean>} A promise resolving to the operation result.
	 */
	async finishUserSessions(userId: string, finishedAt: number): Promise<boolean> {
		const result = await this.client.query(
			'UPDATE user_sessions SET "finishedAt" = $1, "isFinished" = TRUE WHERE "userId" = $2 AND "isFinished" = FALSE',
			[finishedAt, userId]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	/**
	 * Retrieves active session count.
	 * @returns {Promise<number>} A promise resolving to the operation result.
	 */
	async getActiveSessionCount(): Promise<number> {
		const result = await this.client.query(
			'SELECT COUNT(*) as count FROM user_sessions WHERE "isFinished" = FALSE'
		);
		return Number.parseInt(result.rows[0].count, 10);
	}

	/**
	 * Retrieves sessions by day.
	 * @returns {Promise<{ day: number; count: number }[]>} A promise resolving to the operation result.
	 */
	async getSessionsByDay(): Promise<{ day: number; count: number }[]> {
		const result = await this.client.query(`
			SELECT EXTRACT(DOW FROM TO_TIMESTAMP("startedAt" / 1000))::int AS day, COUNT(*) AS count
			FROM user_sessions
			GROUP BY day
			ORDER BY day
		`);
		return result.rows.map(
			/**
			 * Transforms one item while building the derived collection.
			 * @param {any} r r.
			 * @returns {{ day: number; count: number; }} The operation result.
			 */
			r => ({ day: r.day as number, count: Number.parseInt(r.count, 10) })
		);
	}

	/**
	 * Retrieves popular times.
	 * @returns {Promise<{ hour: number; count: number }[]>} A promise resolving to the operation result.
	 */
	async getPopularTimes(): Promise<{ hour: number; count: number }[]> {
		const result = await this.client.query(`
			SELECT EXTRACT(HOUR FROM TO_TIMESTAMP("startedAt" / 1000))::int AS hour, COUNT(*) AS count
			FROM user_sessions
			GROUP BY hour
			ORDER BY count DESC
			LIMIT 5
		`);
		return result.rows.map(
			/**
			 * Transforms one item while building the derived collection.
			 * @param {any} r r.
			 * @returns {{ hour: number; count: number; }} The operation result.
			 */
			r => ({ hour: r.hour as number, count: Number.parseInt(r.count, 10) })
		);
	}
}
