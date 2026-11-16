/**
 * Autor: Justus Heinz

 */

//Ai-Generated
import { Client } from 'pg';

type ExRow = [string, string, string, string | null]; // [id, name, type, muscleGroup]
const SYSTEM_EXERCISES: ExRow[] = [
	['00000000-0000-4000-8000-000000000001', 'Bench Press', 'weighted', 'Chest'],
	['00000000-0000-4000-8000-000000000002', 'Squat', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000003', 'Pull-Up', 'bodyweight', 'Back'],
	['00000000-0000-4000-8000-000000000004', 'Running', 'cardio', null],
	['00000000-0000-4000-8000-000000000005', 'Incline Bench Press', 'weighted', 'Chest'],
	['00000000-0000-4000-8000-000000000006', 'Decline Bench Press', 'weighted', 'Chest'],
	['00000000-0000-4000-8000-000000000007', 'Cable Fly', 'weighted', 'Chest'],
	['00000000-0000-4000-8000-000000000008', 'Dumbbell Fly', 'weighted', 'Chest'],
	['00000000-0000-4000-8000-000000000009', 'Push-Up', 'bodyweight', 'Chest'],
	['00000000-0000-4000-8000-000000000010', 'Dips', 'bodyweight', 'Chest'],
	['00000000-0000-4000-8000-000000000011', 'Deadlift', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000012', 'Barbell Row', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000013', 'Lat Pulldown', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000014', 'Seated Cable Row', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000015', 'T-Bar Row', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000016', 'Face Pull', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000017', 'Leg Press', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000018', 'Romanian Deadlift', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000019', 'Lunges', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000020', 'Leg Curl', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000021', 'Leg Extension', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000022', 'Calf Raises', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000023', 'Bulgarian Split Squat', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000024', 'Hack Squat', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000025', 'Glute Bridge', 'bodyweight', 'Legs'],
	['00000000-0000-4000-8000-000000000026', 'Hip Thrust', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000027', 'Overhead Press', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000028', 'Lateral Raise', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000029', 'Front Raise', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000030', 'Arnold Press', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000031', 'Reverse Fly', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000032', 'Upright Row', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000033', 'Barbell Curl', 'weighted', 'Biceps'],
	['00000000-0000-4000-8000-000000000034', 'Hammer Curl', 'weighted', 'Biceps'],
	['00000000-0000-4000-8000-000000000035', 'Preacher Curl', 'weighted', 'Biceps'],
	['00000000-0000-4000-8000-000000000036', 'Tricep Pushdown', 'weighted', 'Triceps'],
	['00000000-0000-4000-8000-000000000037', 'Skull Crusher', 'weighted', 'Triceps'],
	['00000000-0000-4000-8000-000000000038', 'Overhead Tricep Extension', 'weighted', 'Triceps'],
	['00000000-0000-4000-8000-000000000039', 'Close Grip Bench Press', 'weighted', 'Triceps'],
	['00000000-0000-4000-8000-000000000040', 'Wrist Curl', 'weighted', 'Forearms'],
	['00000000-0000-4000-8000-000000000041', 'Plank', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000042', 'Crunches', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000043', 'Leg Raises', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000044', 'Russian Twist', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000045', 'Ab Wheel Rollout', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000046', 'Cable Crunch', 'weighted', 'Core'],
	['00000000-0000-4000-8000-000000000047', 'Hanging Knee Raise', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000048', 'Cycling', 'cardio', null],
	['00000000-0000-4000-8000-000000000049', 'Rowing', 'cardio', null],
	['00000000-0000-4000-8000-000000000050', 'Jump Rope', 'cardio', null],
	['00000000-0000-4000-8000-000000000051', 'Stairmaster', 'cardio', null],
	['00000000-0000-4000-8000-000000000052', 'Elliptical', 'cardio', null],
	['00000000-0000-4000-8000-000000000053', 'Swimming', 'cardio', null],
	['00000000-0000-4000-8000-000000000054', 'Zercher Squat', 'weighted', 'Legs'],
	['00000000-0000-4000-8000-000000000055', 'Farmers Walk', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000056', 'Suitcase Carry', 'weighted', 'Core'],
	['00000000-0000-4000-8000-000000000057', 'Turkish Get-Up', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000058', 'Kettlebell Swing', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000059', 'Battle Ropes', 'cardio', 'Full Body'],
	['00000000-0000-4000-8000-000000000060', 'Box Jump', 'bodyweight', 'Legs'],
	['00000000-0000-4000-8000-000000000061', 'Pistol Squat', 'bodyweight', 'Legs'],
	['00000000-0000-4000-8000-000000000062', 'Dragon Flag', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000063', 'Muscle-Up', 'bodyweight', 'Full Body'],
	['00000000-0000-4000-8000-000000000064', 'Handstand Push-Up', 'bodyweight', 'Shoulders'],
	['00000000-0000-4000-8000-000000000065', 'Nordic Curl', 'bodyweight', 'Legs'],
	['00000000-0000-4000-8000-000000000066', 'Good Morning', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000067', 'Pendlay Row', 'weighted', 'Back'],
	['00000000-0000-4000-8000-000000000068', 'Snatch', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000069', 'Clean and Jerk', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000070', 'Tire Flip', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000071', 'Sled Push', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000072', 'Wall Ball', 'weighted', 'Full Body'],
	['00000000-0000-4000-8000-000000000073', 'Landmine Press', 'weighted', 'Shoulders'],
	['00000000-0000-4000-8000-000000000074', 'Copenhagen Plank', 'bodyweight', 'Core'],
	['00000000-0000-4000-8000-000000000075', 'Sissy Squat', 'bodyweight', 'Legs']
];

type PlanExRow = [string, string, number, number | null, number | null, number | null, number | null];
// [exerciseId, planExId, order, targetSets, targetReps, targetWeight, targetDurationMinutes]
type PlanSeed = { id: string; name: string; description: string; exercises: PlanExRow[] };
const SYSTEM_PLANS: PlanSeed[] = [
	{
		id: '10000000-0000-4000-8000-000000000001',
		name: 'PPL: Push Day',
		description: 'Chest, Shoulders & Triceps',
		exercises: [
			['00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1, 4, 8, null, null],
			['00000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 2, 3, 10, null, null],
			['00000000-0000-4000-8000-000000000027', '20000000-0000-4000-8000-000000000003', 3, 3, 10, null, null],
			['00000000-0000-4000-8000-000000000028', '20000000-0000-4000-8000-000000000004', 4, 3, 15, null, null],
			['00000000-0000-4000-8000-000000000036', '20000000-0000-4000-8000-000000000005', 5, 3, 12, null, null]
		]
	},
	{
		id: '10000000-0000-4000-8000-000000000002',
		name: 'PPL: Pull Day',
		description: 'Back & Biceps',
		exercises: [
			['00000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000006', 1, 4, 8, null, null],
			['00000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000007', 2, 4, 5, null, null],
			['00000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000008', 3, 4, 10, null, null],
			['00000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000009', 4, 3, 12, null, null],
			['00000000-0000-4000-8000-000000000033', '20000000-0000-4000-8000-000000000010', 5, 3, 12, null, null]
		]
	},
	{
		id: '10000000-0000-4000-8000-000000000003',
		name: 'PPL: Leg Day',
		description: 'Quads, Hamstrings & Calves',
		exercises: [
			['00000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000011', 1, 4, 8, null, null],
			['00000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000012', 2, 4, 10, null, null],
			['00000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000013', 3, 3, 10, null, null],
			['00000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000014', 4, 3, 12, null, null],
			['00000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000015', 5, 4, 15, null, null]
		]
	},
	{
		id: '10000000-0000-4000-8000-000000000004',
		name: 'Full Body Starter',
		description: 'All major muscle groups',
		exercises: [
			['00000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000016', 1, 3, 8, null, null],
			['00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000017', 2, 3, 8, null, null],
			['00000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000018', 3, 3, 5, null, null],
			['00000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000019', 4, 3, 8, null, null],
			['00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000020', 5, null, null, null, 20]
		]
	},
	{
		id: '10000000-0000-4000-8000-000000000005',
		name: 'Cardio & Core',
		description: 'Cardio and core training',
		exercises: [
			['00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000021', 1, null, null, null, 30],
			['00000000-0000-4000-8000-000000000041', '20000000-0000-4000-8000-000000000022', 2, 3, null, null, null],
			['00000000-0000-4000-8000-000000000042', '20000000-0000-4000-8000-000000000023', 3, 3, 20, null, null],
			['00000000-0000-4000-8000-000000000043', '20000000-0000-4000-8000-000000000024', 4, 3, 15, null, null],
			['00000000-0000-4000-8000-000000000050', '20000000-0000-4000-8000-000000000025', 5, null, null, null, 10]
		]
	}
];

export class SystemDao {
	constructor(private client: Client) {}

	async seedSystemExercises() {
		let created = 0;
		for (const [id, name, type, muscleGroup] of SYSTEM_EXERCISES) {
			const result = await this.client.query(
				`INSERT INTO exercises ("id", "userId", "name", "type", "muscleGroup", "isSystemProperty")
                 VALUES ($1, NULL, $2, $3, $4, TRUE)
                 ON CONFLICT ("id") DO NOTHING`,
				[id, name, type, muscleGroup]
			);
			created += result.rowCount ?? 0;
		}
		const total = await this.client.query(
			`SELECT COUNT(*)::int as count FROM exercises WHERE "isSystemProperty" = TRUE AND "isDeleted" = FALSE`
		);
		return { created, total: total.rows[0].count };
	}

	async seedSystemWorkoutPlans() {
		let plansCreated = 0;
		let exercisesCreated = 0;
		const createdAt = Date.now();

		for (const plan of SYSTEM_PLANS) {
			const planResult = await this.client.query(
				`INSERT INTO workout_plans ("id", "userId", "name", "description", "createdAt", "isSystemProperty")
                 VALUES ($1, NULL, $2, $3, $4, TRUE)
                 ON CONFLICT ("id") DO NOTHING`,
				[plan.id, plan.name, plan.description, createdAt]
			);
			plansCreated += planResult.rowCount ?? 0;

			for (const [exerciseId, planExId, order, sets, reps, weight, duration] of plan.exercises) {
				const exResult = await this.client.query(
					`INSERT INTO workout_plan_exercises
                     ("id", "workoutPlanId", "exerciseId", "exerciseOrder", "targetSets", "targetReps", "targetWeight", "targetDurationMinutes")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT ("id") DO NOTHING`,
					[planExId, plan.id, exerciseId, order, sets, reps, weight, duration]
				);
				exercisesCreated += exResult.rowCount ?? 0;
			}
		}
		return { plansCreated, exercisesCreated };
	}

	async getAllSystemPlans() {
		const result = await this.client.query(
			`SELECT
               p.*,
               COALESCE(
                 json_agg(e.* ORDER BY e."exerciseOrder") FILTER (WHERE e.id IS NOT NULL),
                 '[]'
               ) AS exercises
             FROM workout_plans p
             LEFT JOIN workout_plan_exercises e ON e."workoutPlanId" = p.id
             WHERE p."isSystemProperty" = TRUE AND p."isDeleted" = FALSE
             GROUP BY p.id
             ORDER BY p."createdAt" ASC`
		);
		return result.rows;
	}

	async addExerciseToSystemPlan(
		planId: string,
		exerciseId: string,
		exerciseOrder: number,
		targetSets?: number,
		targetReps?: number,
		targetWeight?: number,
		targetDurationMinutes?: number
	) {
		const plan = await this.client.query(
			`SELECT id FROM workout_plans WHERE "id" = $1 AND "isSystemProperty" = TRUE AND "isDeleted" = FALSE`,
			[planId]
		);
		if (plan.rowCount === 0) return null;

		const exercise = await this.client.query(
			`SELECT id FROM exercises WHERE "id" = $1 AND "isSystemProperty" = TRUE AND "isDeleted" = FALSE`,
			[exerciseId]
		);
		if (exercise.rowCount === 0) return null;

		const id = crypto.randomUUID();
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

	async adminCreateSystemPlan(name: string, description?: string) {
		const id = crypto.randomUUID();
		const result = await this.client.query(
			`INSERT INTO workout_plans ("id", "userId", "name", "description", "createdAt", "isSystemProperty")
             VALUES ($1, NULL, $2, $3, $4, TRUE)
             RETURNING *`,
			[id, name, description ?? null, Date.now()]
		);
		return result.rows[0];
	}

	async adminDeleteSystemPlan(id: string): Promise<boolean> {
		const result = await this.client.query(
			`UPDATE workout_plans SET "isDeleted" = TRUE
             WHERE "id" = $1 AND "isSystemProperty" = TRUE AND "isDeleted" = FALSE`,
			[id]
		);
		return result.rowCount !== null && result.rowCount > 0;
	}

	async adminRemoveExerciseFromPlan(planExerciseId: string): Promise<boolean> {
		const result = await this.client.query(`DELETE FROM workout_plan_exercises WHERE "id" = $1`, [planExerciseId]);
		return result.rowCount !== null && result.rowCount > 0;
	}
}
