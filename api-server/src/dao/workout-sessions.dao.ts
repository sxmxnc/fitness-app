/**
 * Autor: Justus Heinz

 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
	WorkoutSession,
	WorkoutSessionWithExercises,
	SessionExercise
} from '../models/workout_entities/workout-session.js';

export class WorkoutSessionsDao {
	constructor(private client: Pool) {}

	async startSession(
		userId: string,
		workoutPlanId?: string,
		workoutDate?: number,
		notes?: string
	): Promise<WorkoutSession | null> {
		if (workoutPlanId) {
			const plan = await this.client.query(
				`SELECT id FROM workout_plans WHERE "id" = $1 AND ("userId" = $2 OR "isSystemProperty" = TRUE) AND "isDeleted" = FALSE`,
				[workoutPlanId, userId]
			);
			if (plan.rowCount === 0) return null;
		}

		const id = uuidv4();
		const result = await this.client.query(
			`INSERT INTO workout_sessions ("id", "userId", "workoutPlanId", "workoutDate", "startedAt", "notes")
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
			[id, userId, workoutPlanId || null, workoutDate ?? null, Date.now(), notes ?? null]
		);
		return result.rows[0];
	}

	async getSessionById(id: string, userId: string): Promise<WorkoutSessionWithExercises | null> {
		const session = await this.client.query(
			`SELECT * FROM workout_sessions
             WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[id, userId]
		);
		if (session.rowCount === 0) return null;

		const exercises = await this.client.query(
			`SELECT * FROM workout_session_exercises
             WHERE "workoutSessionId" = $1
             ORDER BY "exerciseOrder" ASC`,
			[id]
		);
		return { ...session.rows[0], exercises: exercises.rows };
	}

	async getActiveSessions(userId: string): Promise<WorkoutSession[]> {
		const result = await this.client.query(
			`SELECT * FROM workout_sessions
             WHERE "userId" = $1 AND "finishedAt" IS NULL AND "isDeleted" = FALSE
             ORDER BY "startedAt" DESC`,
			[userId]
		);
		return result.rows;
	}

	async finishSession(id: string, userId: string): Promise<WorkoutSession | null> {
		const result = await this.client.query(
			`UPDATE workout_sessions SET "finishedAt" = $1
             WHERE "id" = $2 AND "userId" = $3 AND "finishedAt" IS NULL AND "isDeleted" = FALSE
             RETURNING *`,
			[Date.now(), id, userId]
		);
		return result.rows[0] || null;
	}

	async updateSession(
		id: string,
		userId: string,
		fields: Partial<{ notes: string; workoutDate: number }>
	): Promise<WorkoutSession | null> {
		const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return null;

		const setClause = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
		const values: unknown[] = [...entries.map(([, v]) => v), id, userId];

		const result = await this.client.query(
			`UPDATE workout_sessions SET ${setClause}
             WHERE "id" = $${entries.length + 1}
             AND "userId" = $${entries.length + 2}
             AND "isDeleted" = FALSE
             RETURNING *`,
			values
		);
		return result.rows[0] || null;
	}

	async deleteSession(id: string, userId: string) {
		const result = await this.client.query(
			`UPDATE workout_sessions SET "isDeleted" = TRUE
             WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[id, userId]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	// ── Session Exercises ──────────────────────────────────────────

	async addExerciseToSession(
		sessionId: string,
		userId: string,
		exerciseId: string,
		exerciseOrder: number,
		actualSets?: number,
		actualReps?: number,
		actualWeight?: number,
		actualDurationMinutes?: number,
		notes?: string
	): Promise<SessionExercise | null> {
		const session = await this.client.query(
			`SELECT id FROM workout_sessions WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[sessionId, userId]
		);
		if (session.rowCount === 0) return null;

		const id = uuidv4();
		const result = await this.client.query(
			`INSERT INTO workout_session_exercises
             ("id", "workoutSessionId", "exerciseId", "exerciseOrder", "actualSets", "actualReps", "actualWeight", "actualDurationMinutes", "notes")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
			[
				id,
				sessionId,
				exerciseId,
				exerciseOrder,
				actualSets ?? null,
				actualReps ?? null,
				actualWeight ?? null,
				actualDurationMinutes ?? null,
				notes ?? null
			]
		);
		return result.rows[0];
	}

	async updateSessionExercise(
		sessionId: string,
		sessionExerciseId: string,
		userId: string,
		fields: Partial<{
			actualSets: number;
			actualReps: number;
			actualWeight: number;
			actualDurationMinutes: number;
			notes: string;
		}>
	): Promise<SessionExercise | null> {
		const session = await this.client.query(
			`SELECT id FROM workout_sessions WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[sessionId, userId]
		);
		if (session.rowCount === 0) return null;

		const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return null;

		const setClause = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
		const values: unknown[] = [...entries.map(([, v]) => v), sessionExerciseId, sessionId];

		const result = await this.client.query(
			`UPDATE workout_session_exercises SET ${setClause}
             WHERE "id" = $${entries.length + 1}
             AND "workoutSessionId" = $${entries.length + 2}
             RETURNING *`,
			values
		);
		return result.rows[0] || null;
	}

	async removeExerciseFromSession(sessionId: string, sessionExerciseId: string, userId: string) {
		const session = await this.client.query(
			`SELECT id FROM workout_sessions WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[sessionId, userId]
		);
		if (session.rowCount === 0) return false;

		const result = await this.client.query(
			`DELETE FROM workout_session_exercises
             WHERE "id" = $1 AND "workoutSessionId" = $2`,
			[sessionExerciseId, sessionId]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	async getExerciseStatsByDay(
		userId: string,
		range: { from?: number; to?: number }
	): Promise<{ day: string; sessions: { planName: string | null; durationSeconds: number }[] }[]> {
		const conditions: string[] = [`ws."userId" = $1`, `ws."finishedAt" IS NOT NULL`, `ws."isDeleted" = FALSE`];
		const values: unknown[] = [userId];

		if (range.from !== undefined) {
			values.push(range.from);
			conditions.push(`ws."startedAt" >= $${values.length}`);
		}
		if (range.to !== undefined) {
			values.push(range.to);
			conditions.push(`ws."startedAt" <= $${values.length}`);
		}

		const result = await this.client.query(
			`
            SELECT
                TO_CHAR(TO_TIMESTAMP(ws."startedAt" / 1000), 'YYYY-MM-DD') AS day,
                wp.name AS "planName",
                ROUND((ws."finishedAt" - ws."startedAt") / 1000.0)::int AS "durationSeconds"
            FROM workout_sessions ws
            LEFT JOIN workout_plans wp ON ws."workoutPlanId" = wp.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY day ASC, "durationSeconds" DESC
        `,
			values
		);

		const grouped = new Map<string, { planName: string | null; durationSeconds: number }[]>();
		for (const row of result.rows) {
			if (!grouped.has(row.day)) grouped.set(row.day, []);
			grouped.get(row.day)!.push({ planName: row.planName ?? null, durationSeconds: row.durationSeconds });
		}

		return [...grouped.entries()].map(([day, sessions]) => ({ day, sessions }));
	}
}
