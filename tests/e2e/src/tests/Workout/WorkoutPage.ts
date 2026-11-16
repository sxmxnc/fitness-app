/**
 * Autor: Justus Heinz

 */
import type { Page, Locator } from 'playwright';

export const MOCK_PLANS = [
	{
		id: 'plan-1',
		name: 'Push Day',
		description: null,
		isSystemProperty: false,
		exerciseCount: 1
	}
];

export const MOCK_EXERCISES_FOR_PLAN = [
	{
		id: 'ex1',
		exerciseId: 'e1',
		exerciseName: 'Bench Press',
		exerciseOrder: 1,
		targetSets: 3,
		targetReps: 10,
		targetWeight: 60
	}
];

export async function mockWorkoutApis(page: Page): Promise<void> {
	await page.route('**/exercises**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/workout-plans**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PLANS) })
	);
	await page.route('**/workout-sessions**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'sess-1' }) })
	);
	await page.route('**/workout-plans/order**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/workout-plans/*/exercises**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXERCISES_FOR_PLAN) })
	);
	await page.route('**/workout-sessions/*/finish', route =>
		route.fulfill({ status: 200, body: '{}' })
	);
	await page.route('**/workout-sessions/*/exercises', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'se-1' }) })
	);
	await page.route('**/workout-sessions/*/exercises/*', route =>
		route.fulfill({ status: 200, body: '{}' })
	);
}

export async function mockEmptyWorkoutApis(page: Page): Promise<void> {
	await page.route('**/workout-plans/order**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/workout-plans/*/exercises**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/workout-plans**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
}

export class WorkoutListPage {
	constructor(private readonly page: Page) {}

	workoutList(): Locator {
		return this.page.locator('app-workout-list');
	}

	planCard(): Locator {
		return this.workoutList().getByTestId('plan-card').first().locator('.plan-name');
	}

	emptyState(): Locator {
		return this.workoutList().getByTestId('empty-state');
	}

	newPlanBtn(): Locator {
		return this.workoutList().getByTestId('new-plan-btn');
	}

	createPlanModal(): Locator {
		return this.workoutList().getByTestId('create-plan-modal');
	}

	startBtn(): Locator {
		return this.workoutList().getByTestId('start-btn').first();
	}

	deletePlanBtn(): Locator {
		return this.workoutList().getByTestId('delete-plan-btn').first();
	}
}

export class WorkoutSessionPage {
	constructor(private readonly page: Page) {}

	workoutSession(): Locator {
		return this.page.locator('app-workout-session');
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

	addSetBtn(): Locator {
		return this.workoutSession().getByTestId('add-set-btn').first();
	}

	finishBtn(): Locator {
		return this.workoutSession().getByTestId('finish-btn');
	}
}
