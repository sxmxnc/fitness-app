/**
 * Autor: Luca Lammers

 */
import { Entity } from '../entity.js';

/** Describes the user stats shape. */
export type UserStats = Entity & {
	userId: string;
	weight: number | null;
	height: number | null;
	birthDate: number | null;
	dailyCalorieGoal: number | null;
	dailyProteinGoal: number | null;
	dailyFatGoal: number | null;
	dailyCarbsGoal: number | null;
};
