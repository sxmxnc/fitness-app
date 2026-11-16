/**
 * Autor: Justus Heinz

 */
import { HttpClient } from '../../../../http-client.js';
import { BASE_API } from '../../../../config.js';

export type WorkoutPlan = {
	id: string;
	name: string;
	description: string | null;
	isSystemProperty: boolean;
	exerciseCount: number;
};

export type DisplayPlan = WorkoutPlan & {
	isModifiedClassic: boolean;
	originalClassicId: string | null;
};

export type PlanExercise = {
	id: string;
	exerciseId: string;
	exerciseName: string;
	targetSets: number | null;
	targetReps: number | null;
	targetWeight: number | null;
};

export interface AvailableExercise {
	id: string;
	name: string;
	type: string;
	muscleGroup: string | null;
}

type RawPlan = Omit<WorkoutPlan, 'exerciseCount'> & Partial<Pick<WorkoutPlan, 'exerciseCount'>>;

class WorkoutPlanService {
	async getPlans(http: HttpClient, userId: string): Promise<WorkoutPlan[]> {
		const rawPlans = await this.fetchPlanList(http, userId);
		return Promise.all(
			rawPlans.map(async p => {
				try {
					const exRes = await http.get(`${BASE_API}/workout-plans/${p.id}/exercises?userId=${userId}`);
					const exercises = exRes.ok ? await exRes.json() : [];
					return {
						...p,
						exerciseCount: Array.isArray(exercises) ? exercises.length : (p.exerciseCount ?? 0)
					} as WorkoutPlan;
				} catch {
					return { ...p, exerciseCount: p.exerciseCount ?? 0 } as WorkoutPlan;
				}
			})
		);
	}

	async getPlanExercises(http: HttpClient, userId: string, planId: string): Promise<PlanExercise[]> {
		const urls = [
			`${BASE_API}/workout-plans/${planId}/exercises`,
			`${BASE_API}/workout-plans/${planId}/exercises?userId=${userId}`
		];
		return this.fetchArray<PlanExercise>(http, urls);
	}

	async getPlanOrder(http: HttpClient, userId: string): Promise<string[]> {
		try {
			const res = await http.get(`${BASE_API}/workout-plans/order?userId=${userId}`);
			if (!res.ok) return [];
			const data = await res.json();
			return Array.isArray(data) ? data : [];
		} catch {
			return [];
		}
	}

	async savePlanOrder(http: HttpClient, userId: string, planIds: string[]): Promise<void> {
		try {
			await http.put(`${BASE_API}/workout-plans/order`, { userId, planIds });
		} catch {
			/* ignore */
		}
	}

	async getAvailableExercises(http: HttpClient, userId: string): Promise<AvailableExercise[]> {
		try {
			const res = await http.get(`${BASE_API}/exercises?userId=${userId}`);
			return res.ok ? res.json() : [];
		} catch {
			return [];
		}
	}

	async createPlan(http: HttpClient, userId: string, name: string): Promise<{ id: string }> {
		const res = await http.post(`${BASE_API}/workout-plans`, { userId, name });
		if (!res.ok) throw new Error('plan');
		return res.json();
	}

	async updatePlan(http: HttpClient, userId: string, planId: string, name: string): Promise<void> {
		await http.put(`${BASE_API}/workout-plans/${planId}`, { userId, name });
	}

	async deletePlan(http: HttpClient, userId: string, planId: string): Promise<boolean> {
		const res = await http.delete(`${BASE_API}/workout-plans/${planId}?userId=${userId}`);
		return res.ok;
	}

	async createExercise(http: HttpClient, userId: string, name: string): Promise<{ id: string }> {
		const res = await http.post(`${BASE_API}/exercises?userId=${userId}`, { name, type: 'weighted' });
		if (!res.ok) throw new Error('exercise');
		return res.json();
	}

	async addExerciseToPlan(
		http: HttpClient,
		userId: string,
		planId: string,
		exerciseId: string,
		order: number,
		sets: number,
		reps: number,
		weight: number
	): Promise<void> {
		await http.post(`${BASE_API}/workout-plans/${planId}/exercises`, {
			userId,
			exerciseId,
			exerciseOrder: order,
			targetSets: sets,
			targetReps: reps,
			targetWeight: weight > 0 ? Math.round(weight) : null
		});
	}

	async removePlanExercise(http: HttpClient, userId: string, planId: string, planExerciseId: string): Promise<void> {
		await http.delete(`${BASE_API}/workout-plans/${planId}/exercises/${planExerciseId}?userId=${userId}`);
	}

	private async fetchPlanList(http: HttpClient, userId: string): Promise<RawPlan[]> {
		const urls = [`${BASE_API}/workout-plans`, `${BASE_API}/workout-plans?userId=${userId}`];
		return this.fetchArray<RawPlan>(http, urls);
	}

	private async fetchArray<T>(http: HttpClient, urls: string[]): Promise<T[]> {
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
}

export default new WorkoutPlanService();
