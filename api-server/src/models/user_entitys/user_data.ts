/**
 * Autor: Luca Lammers

 */
import { Entity } from '../entity.js';

/** Describes the user data shape. */
export type UserData = Entity & {
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	role: 'user' | 'admin';
	weight: number | null;
	height: number | null;
	birthDate: number | null;
	dailyCalorieGoal: number | null;
	dailyProteinGoal: number | null;
	dailyFatGoal: number | null;
	dailyCarbsGoal: number | null;
};
