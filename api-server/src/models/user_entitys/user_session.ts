/**
 * Autor: Luca Lammers

 */

export type UserSessions = {
	id: string;
	userId: string;
	startedAt: number;
	finishedAt: number | null;
	isFinished: boolean;
};
