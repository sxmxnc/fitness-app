/**
 * Autor: Justus Heinz

 */
import { HttpClient } from '../../../../http-client.js';
import { BASE_API } from '../../../../config.js';

export type PlanSummary = { id: string; name: string };

export type PlanExerciseEntry = {
	exerciseId: string;
	exerciseName: string;
	exerciseOrder: number;
	targetSets: number | null;
	targetReps: number | null;
	targetWeight: number | null;
};

class WorkoutSessionService {
	async createSession(http: HttpClient, userId: string, planId: string): Promise<{ id: string } | null> {
		const res = await http.post(`${BASE_API}/workout-sessions`, { userId, workoutPlanId: planId });
		return res.ok ? res.json() : null;
	}

	async fetchPlanName(http: HttpClient, userId: string, planId: string): Promise<string> {
		const urls = [`${BASE_API}/workout-plans`, `${BASE_API}/workout-plans?userId=${userId}`];
		for (const url of urls) {
			try {
				const res = await http.get(url);
				if (!res.ok) continue;
				const plans: PlanSummary[] = await res.json();
				if (Array.isArray(plans)) return plans.find(p => p.id === planId)?.name ?? '';
			} catch {
				/* try next supported route shape */
			}
		}
		return '';
	}

	async fetchPlanExercises(http: HttpClient, userId: string, planId: string): Promise<PlanExerciseEntry[]> {
		const urls = [
			`${BASE_API}/workout-plans/${planId}/exercises`,
			`${BASE_API}/workout-plans/${planId}/exercises?userId=${userId}`
		];
		for (const url of urls) {
			try {
				const res = await http.get(url);
				if (!res.ok) continue;
				const data = await res.json();
				if (Array.isArray(data)) return data;
			} catch {
				/* try next supported route shape */
			}
		}
		return [];
	}

	async addExerciseToSession(
		http: HttpClient,
		userId: string,
		sessionId: string,
		data: {
			exerciseId: string;
			exerciseOrder: number;
			actualSets: number;
			actualReps: number;
			actualWeight: number | null;
		}
	): Promise<{ id: string } | null> {
		const res = await http.post(`${BASE_API}/workout-sessions/${sessionId}/exercises`, { userId, ...data });
		return res.ok ? res.json() : null;
	}

	async updateSessionExercise(
		http: HttpClient,
		userId: string,
		sessionId: string,
		sessionExerciseId: string,
		data: { actualSets: number; actualReps: number | null; actualWeight: number | null }
	): Promise<void> {
		await http.put(`${BASE_API}/workout-sessions/${sessionId}/exercises/${sessionExerciseId}`, { userId, ...data });
	}

	async finishSession(http: HttpClient, userId: string, sessionId: string): Promise<boolean> {
		const res = await http.put(`${BASE_API}/workout-sessions/${sessionId}/finish`, { userId });
		return res.ok;
	}
}

export default new WorkoutSessionService();
