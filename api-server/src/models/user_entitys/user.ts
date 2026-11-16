/**
 * Autor: Luca Lammers

 */
import { Entity } from '../entity.js';

/** Describes the user shape. */
export type User = Entity & {
	email: string;
	firstName: string;
	lastName: string;
	role: 'user' | 'admin';
	password: string;
	securityQuestionKey: string | null;
	securityAnswerHash: string | null;
	isDeactivated: boolean;
};
