/**
 * Autor: Justus Heinz

 */

import { Pool } from 'pg';
import type { WorkoutSession } from '../models/workout_entities/workout-session.js';

export class WorkoutHistoryDao {
	constructor(private client: Pool) {}

	async getHistory(userId: string, fromTs?: number, toTs?: number): Promise<WorkoutSession[]> {
		let query = `SELECT * FROM workout_sessions
                     WHERE "userId" = $1 AND "finishedAt" IS NOT NULL AND "isDeleted" = FALSE`;
		const values: unknown[] = [userId];

		if (fromTs !== undefined) {
			values.push(fromTs);
			query += ` AND "workoutDate" >= $${values.length}`;
		}
		if (toTs !== undefined) {
			values.push(toTs);
			query += ` AND "workoutDate" <= $${values.length}`;
		}

		query += ` ORDER BY "workoutDate" DESC NULLS LAST, "startedAt" DESC`;

		const result = await this.client.query(query, values);
		return result.rows;
	}
}
