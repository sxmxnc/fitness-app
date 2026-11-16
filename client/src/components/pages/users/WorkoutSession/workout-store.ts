/**
 * Autor: Justus Heinz

 */

export type SetRow = { reps: number; weight: number };

export type SessionExercise = {
	exerciseId: string;
	name: string;
	exerciseOrder: number;
	sessionExerciseId: string | null;
	sets: SetRow[];
};

class WorkoutStore extends EventTarget {
	sessionId: string | null = null;
	planId: string | null = null;
	planName: string = '';
	exercises: SessionExercise[] = [];
	elapsedSeconds: number = 0;
	isActive: boolean = false;
	loading: boolean = false;

	private timerInterval: ReturnType<typeof setInterval> | null = null;

	notify() {
		this.dispatchEvent(new CustomEvent('change'));
	}

	startTimer() {
		if (this.timerInterval) return;
		this.timerInterval = setInterval(() => {
			this.elapsedSeconds++;
			this.notify();
		}, 1000);
	}

	stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	clear() {
		this.stopTimer();
		this.sessionId = null;
		this.planId = null;
		this.planName = '';
		this.exercises = [];
		this.elapsedSeconds = 0;
		this.isActive = false;
		this.loading = false;
		this.notify();
	}

	updateSet(exIdx: number, setIdx: number, field: keyof SetRow, value: number) {
		this.exercises = this.exercises.map((ex, i) => {
			if (i !== exIdx) return ex;
			return { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)) };
		});
		this.notify();
	}

	addSet(exIdx: number) {
		this.exercises = this.exercises.map((ex, i) => {
			if (i !== exIdx) return ex;
			const last = ex.sets[ex.sets.length - 1] ?? { reps: 10, weight: 0 };
			return { ...ex, sets: [...ex.sets, { ...last }] };
		});
		this.notify();
	}

	removeSet(exIdx: number, setIdx: number) {
		this.exercises = this.exercises.map((ex, i) => {
			if (i !== exIdx || ex.sets.length <= 1) return ex;
			return { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) };
		});
		this.notify();
	}
}

export const workoutStore = new WorkoutStore();
