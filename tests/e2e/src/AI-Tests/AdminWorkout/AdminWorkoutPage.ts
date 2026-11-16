import { Locator, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class AdminWorkoutPage {
	constructor(private page: Page) {}

	adminWorkouts(): Locator {
		return this.page.locator('admin-workouts');
	}

	exercisesTab(): Locator {
		return this.adminWorkouts().getByRole('button', { name: 'Uebungen' });
	}

	plansTab(): Locator {
		return this.adminWorkouts().getByRole('button', { name: 'Workout Plaene' });
	}

	searchInput(): Locator {
		return this.adminWorkouts().locator('.search-input');
	}

	exerciseRows(): Locator {
		return this.adminWorkouts().locator('.exercise-row');
	}

	planRows(): Locator {
		return this.adminWorkouts().locator('.plan-row');
	}

	emptyState(): Locator {
		return this.adminWorkouts().locator('.empty');
	}

	errorMessage(): Locator {
		return this.adminWorkouts().locator('.error-msg');
	}

	newExerciseButton(): Locator {
		return this.adminWorkouts().locator('.btn-new-exercise').first();
	}

	createDialog(): Locator {
		return this.adminWorkouts().locator('.create-dialog');
	}

	createError(): Locator {
		return this.adminWorkouts().locator('.create-error');
	}

	createNameInput(): Locator {
		return this.createDialog().locator('.create-input').first();
	}

	createSubmitButton(): Locator {
		return this.createDialog().locator('.confirm-btn--create');
	}

	firstDeleteButton(): Locator {
		return this.adminWorkouts().locator('.btn-delete').first();
	}

	confirmOverlay(): Locator {
		return this.adminWorkouts().locator('.confirm-overlay');
	}

	confirmCancelButton(): Locator {
		return this.adminWorkouts().locator('.confirm-btn--cancel');
	}

	confirmDeleteButton(): Locator {
		return this.adminWorkouts().locator('.confirm-btn--delete');
	}

	async goto() {
		await this.page.goto(`${BASE_URL}/admin/workouts`);
		await this.page.waitForURL(/\/admin\/workouts/);
	}
}
