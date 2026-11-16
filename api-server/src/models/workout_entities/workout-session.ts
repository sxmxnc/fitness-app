/**
 * Autor: Justus Heinz

 */

export type SessionExercise = {
	id: string;
	workoutSessionId: string;
	exerciseId: string;
	exerciseOrder: number;
	actualSets: number | null;
	actualReps: number | null;
	actualWeight: number | null;
	actualDurationMinutes: number | null;
	notes: string | null;
};

export type WorkoutSession = {
	id: string;
	userId: string;
	workoutPlanId: string | null;
	workoutDate: number | null;
	startedAt: number;
	finishedAt: number | null;
	notes: string | null;
	isDeleted: boolean;
};

export type WorkoutSessionWithExercises = WorkoutSession & {
	exercises: SessionExercise[];
};
