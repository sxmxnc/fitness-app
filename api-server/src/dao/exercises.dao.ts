/**
 * Autor: Justus Heinz

 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { Exercise } from '../models/workout_entities/exercise.js';

export class ExercisesDao {
	constructor(private client: Pool) {}

	async getAllExercises(userId: string): Promise<Exercise[]> {
		const result = await this.client.query(
			`SELECT * FROM exercises 
             WHERE "isDeleted" = FALSE 
             AND ("isSystemProperty" = TRUE OR "userId" = $1)`,
			[userId]
		);
		return result.rows;
	}

	async getExerciseById(id: string, userId: string): Promise<Exercise | null> {
		const result = await this.client.query(
			`SELECT * FROM exercises 
             WHERE "id" = $1 
             AND "isDeleted" = FALSE 
             AND ("isSystemProperty" = TRUE OR "userId" = $2)`,
			[id, userId]
		);
		return result.rows[0] || null;
	}

	async createExercise(
		userId: string,
		name: string,
		type: string,
		description?: string,
		muscleGroup?: string
	): Promise<Exercise> {
		const id = uuidv4();
		const result = await this.client.query(
			`INSERT INTO exercises ("id", "userId", "name", "type", "description", "muscleGroup")
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
			[id, userId, name, type, description ?? null, muscleGroup ?? null]
		);
		return result.rows[0];
	}

	async updateExercise(
		id: string,
		userId: string,
		fields: Partial<{ name: string; type: string; description: string; muscleGroup: string }>
	): Promise<Exercise | null> {
		const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return null;

		const setClause = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
		const values: unknown[] = [...entries.map(([, v]) => v), id, userId];

		const result = await this.client.query(
			`UPDATE exercises SET ${setClause}
             WHERE "id" = $${entries.length + 1}
             AND "userId" = $${entries.length + 2}
             AND "isDeleted" = FALSE
             RETURNING *`,
			values
		);
		return result.rows[0] || null;
	}

	async isSystemExercise(id: string): Promise<boolean> {
		const result = await this.client.query(
			`SELECT "isSystemProperty" FROM exercises WHERE "id" = $1 AND "isDeleted" = FALSE`,
			[id]
		);
		return result.rows[0]?.isSystemProperty === true;
	}

	async deleteExercise(id: string, userId: string) {
		const result = await this.client.query(
			`UPDATE exercises SET "isDeleted" = TRUE
             WHERE "id" = $1
             AND "userId" = $2
             AND "isDeleted" = FALSE`,
			[id, userId]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	async getSystemExercises(): Promise<Exercise[]> {
		const result = await this.client.query(
			`SELECT * FROM exercises WHERE "isSystemProperty" = TRUE AND "isDeleted" = FALSE ORDER BY "name" ASC`
		);
		return result.rows;
	}

	async adminCreateSystemExercise(
		name: string,
		type: string,
		description?: string,
		muscleGroup?: string
	): Promise<Exercise> {
		const id = uuidv4();
		const result = await this.client.query(
			`INSERT INTO exercises ("id", "userId", "name", "type", "description", "muscleGroup", "isSystemProperty")
             VALUES ($1, NULL, $2, $3, $4, $5, TRUE)
             RETURNING *`,
			[id, name, type, description ?? null, muscleGroup ?? null]
		);
		return result.rows[0];
	}

	async adminDeleteSystemExercise(id: string): Promise<boolean> {
		const result = await this.client.query(
			`UPDATE exercises SET "isDeleted" = TRUE
             WHERE "id" = $1 AND "isSystemProperty" = TRUE AND "isDeleted" = FALSE`,
			[id]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}
}
