import { Locator, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class WorkoutPage {
	constructor(private page: Page) {}

	workoutList(): Locator {
		return this.page.locator('app-workout-list');
	}

	workoutSession(): Locator {
		return this.page.locator('app-workout-session');
	}

	newPlanButton(): Locator {
		return this.workoutList().getByTestId('new-plan-btn');
	}

	createPlanModal(): Locator {
		return this.workoutList().getByTestId('create-plan-modal');
	}

	planNameInput(): Locator {
		return this.workoutList().getByTestId('plan-name-input');
	}

	savePlanButton(): Locator {
		return this.workoutList().getByTestId('save-plan-btn');
	}

	planCards(): Locator {
		return this.workoutList().getByTestId('plan-card').locator('.plan-name');
	}

	emptyState(): Locator {
		return this.workoutList().getByTestId('empty-state');
	}

	startButtons(): Locator {
		return this.workoutList().getByTestId('start-btn');
	}

	deleteButtons(): Locator {
		return this.workoutList().getByTestId('delete-plan-btn');
	}

	timer(): Locator {
		return this.workoutSession().getByTestId('timer');
	}

	exercisesList(): Locator {
		return this.workoutSession().getByTestId('exercises-list');
	}

	setRows(): Locator {
		return this.workoutSession().getByTestId('set-row');
	}

	addSetButtons(): Locator {
		return this.workoutSession().getByTestId('add-set-btn');
	}

	finishButton(): Locator {
		return this.workoutSession().getByTestId('finish-btn');
	}

	async gotoList() {
		await this.page.goto(`${BASE_URL}/workouts`);
		await this.page.waitForURL(/\/workouts$/);
	}

	async gotoSession(planId: string) {
		await this.page.goto(`${BASE_URL}/workouts/${planId}/start`);
		await this.page.waitForURL(new RegExp(`/workouts/${planId}/start`));
	}
}
