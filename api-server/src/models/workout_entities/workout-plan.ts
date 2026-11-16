/**
 * Autor: Justus Heinz

 */

export type WorkoutPlan = {
	id: string;
	userId: string | null;
	name: string;
	description: string | null;
	createdAt: number;
	isSystemProperty: boolean;
	isDeleted: boolean;
};

export type PlanExerciseRow = {
	id: string;
	workoutPlanId: string;
	exerciseId: string;
	exerciseOrder: number;
	targetSets: number | null;
	targetReps: number | null;
	targetWeight: number | null;
	targetDurationMinutes: number | null;
};

export type PlanExercise = PlanExerciseRow & {
	exerciseName: string;
	exerciseType: string;
	muscleGroup: string | null;
};
