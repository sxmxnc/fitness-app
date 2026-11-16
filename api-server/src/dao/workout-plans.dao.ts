/**
 * Autor: Justus Heinz

 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { WorkoutPlan, PlanExercise, PlanExerciseRow } from '../models/workout_entities/workout-plan.js';

export class WorkoutPlansDao {
	constructor(private client: Pool) {}

	async getAllPlans(userId: string): Promise<WorkoutPlan[]> {
		const result = await this.client.query(
			`SELECT * FROM workout_plans
             WHERE "isDeleted" = FALSE
             AND ("userId" = $1 OR "isSystemProperty" = TRUE)`,
			[userId]
		);
		return result.rows;
	}

	async isSystemPlan(id: string): Promise<boolean> {
		const result = await this.client.query(
			`SELECT "isSystemProperty" FROM workout_plans WHERE "id" = $1 AND "isDeleted" = FALSE`,
			[id]
		);
		return result.rows[0]?.isSystemProperty === true;
	}

	async createPlan(userId: string, name: string, description?: string): Promise<WorkoutPlan> {
		const id = uuidv4();
		const result = await this.client.query(
			`INSERT INTO workout_plans ("id", "userId", "name", "description", "createdAt")
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
			[id, userId, name, description ?? null, Date.now()]
		);
		return result.rows[0];
	}

	async updatePlan(
		id: string,
		userId: string,
		fields: Partial<{ name: string; description: string }>
	): Promise<WorkoutPlan | null> {
		const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return null;

		const setClause = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
		const values: unknown[] = [...entries.map(([, v]) => v), id, userId];

		const result = await this.client.query(
			`UPDATE workout_plans SET ${setClause}
             WHERE "id" = $${entries.length + 1}
             AND "userId" = $${entries.length + 2}
             AND "isDeleted" = FALSE
             RETURNING *`,
			values
		);
		return result.rows[0] || null;
	}

	async deletePlan(id: string, userId: string) {
		const result = await this.client.query(
			`UPDATE workout_plans SET "isDeleted" = TRUE
             WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[id, userId]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	// ── Plan Exercises ──────────────────────────────────────────

	async addExerciseToPlan(
		planId: string,
		userId: string,
		exerciseId: string,
		exerciseOrder: number,
		targetSets?: number,
		targetReps?: number,
		targetWeight?: number,
		targetDurationMinutes?: number
	): Promise<PlanExerciseRow | null> {
		// Prüfen ob Plan dem User gehört
		const plan = await this.client.query(
			`SELECT id FROM workout_plans WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[planId, userId]
		);
		if (plan.rowCount === 0) return null;

		const id = uuidv4();
		const result = await this.client.query(
			`INSERT INTO workout_plan_exercises 
             ("id", "workoutPlanId", "exerciseId", "exerciseOrder", "targetSets", "targetReps", "targetWeight", "targetDurationMinutes")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
			[
				id,
				planId,
				exerciseId,
				exerciseOrder,
				targetSets ?? null,
				targetReps ?? null,
				targetWeight ?? null,
				targetDurationMinutes ?? null
			]
		);
		return result.rows[0];
	}

	async removeExerciseFromPlan(planId: string, planExerciseId: string, userId: string) {
		// Prüfen ob Plan dem User gehört
		const plan = await this.client.query(
			`SELECT id FROM workout_plans WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[planId, userId]
		);
		if (plan.rowCount === 0) return false;

		const result = await this.client.query(
			`DELETE FROM workout_plan_exercises 
             WHERE "id" = $1 AND "workoutPlanId" = $2`,
			[planExerciseId, planId]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	async getExercisesForPlan(planId: string, userId: string): Promise<PlanExercise[] | null> {
		const plan = await this.client.query(
			`SELECT id FROM workout_plans
             WHERE "id" = $1 AND ("userId" = $2 OR "isSystemProperty" = TRUE) AND "isDeleted" = FALSE`,
			[planId, userId]
		);
		if (plan.rowCount === 0) return null;

		const result = await this.client.query(
			`SELECT wpe.*, e."name" AS "exerciseName", e."type" AS "exerciseType", e."muscleGroup"
             FROM workout_plan_exercises wpe
             JOIN exercises e ON wpe."exerciseId" = e."id"
             WHERE wpe."workoutPlanId" = $1
             ORDER BY wpe."exerciseOrder" ASC`,
			[planId]
		);
		return result.rows;
	}

	async getUserPlanOrder(userId: string): Promise<string[]> {
		const result = await this.client.query(
			`SELECT "planId" FROM user_plan_order WHERE "userId" = $1 ORDER BY "position" ASC`,
			[userId]
		);
		return result.rows.map((r: { planId: string }) => r.planId);
	}

	async setUserPlanOrder(userId: string, planIds: string[]): Promise<void> {
		await this.client.query(`DELETE FROM user_plan_order WHERE "userId" = $1`, [userId]);
		for (let i = 0; i < planIds.length; i++) {
			await this.client.query(
				`INSERT INTO user_plan_order ("userId", "planId", "position") VALUES ($1, $2, $3)`,
				[userId, planIds[i], i]
			);
		}
	}

	async updateExerciseOrder(planId: string, userId: string, order: { id: string; exerciseOrder: number }[]) {
		// Prüfen ob Plan dem User gehört
		const plan = await this.client.query(
			`SELECT id FROM workout_plans WHERE "id" = $1 AND "userId" = $2 AND "isDeleted" = FALSE`,
			[planId, userId]
		);
		if (plan.rowCount === 0) return false;

		// Jedes Exercise updaten
		for (const entry of order) {
			await this.client.query(
				`UPDATE workout_plan_exercises SET "exerciseOrder" = $1
                 WHERE "id" = $2 AND "workoutPlanId" = $3`,
				[entry.exerciseOrder, entry.id, planId]
			);
		}
		return true;
	}
}
