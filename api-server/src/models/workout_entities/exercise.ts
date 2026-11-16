/**
 * Autor: Justus Heinz

 */

export type Exercise = {
	id: string;
	userId: string | null;
	name: string;
	type: 'weighted' | 'bodyweight' | 'cardio';
	description: string | null;
	muscleGroup: string | null;
	isSystemProperty: boolean;
	isDeleted: boolean;
};
