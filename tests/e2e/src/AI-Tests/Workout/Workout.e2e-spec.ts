import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { loginAsUser } from '../../Common/login';
import { WorkoutPage } from './WorkoutPage';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

type WorkoutPlan = {
	id: string;
	name: string;
	description: string | null;
	isSystemProperty: boolean;
	exerciseCount: number;
};

type PlanExercise = {
	id: string;
	exerciseId: string;
	exerciseName: string;
	exerciseOrder: number;
	targetSets: number;
	targetReps: number;
	targetWeight: number;
};

const MOCK_PLANS: WorkoutPlan[] = [
	{ id: 'plan-1', name: 'Push Day', description: null, isSystemProperty: false, exerciseCount: 1 }
];

const MOCK_PLAN_EXERCISES: PlanExercise[] = [
	{
		id: 'plan-ex-1',
		exerciseId: 'exercise-1',
		exerciseName: 'Bankdruecken',
		exerciseOrder: 1,
		targetSets: 3,
		targetReps: 10,
		targetWeight: 60
	}
];

async function mockWorkoutApis(page: Page, plans: WorkoutPlan[] = MOCK_PLANS): Promise<void> {
	await page.route('**/exercises**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/workout-plans/order**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/workout-plans/*/exercises**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PLAN_EXERCISES) })
	);
	await page.route('**/workout-plans/**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
	);
	await page.route('**/workout-plans', route => {
		if (route.request().method() === 'GET') {
			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plans) });
		}
		return route.fulfill({
			status: 201,
			contentType: 'application/json',
			body: JSON.stringify({ id: `plan-${Date.now()}`, name: 'KI Test Plan', description: null })
		});
	});
	await page.route('**/workout-sessions', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'session-1' }) })
	);
	await page.route('**/workout-sessions/*/finish', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
	);
	await page.route('**/workout-sessions/*/exercises**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'session-ex-1' }) })
	);
}

describe('Workout: Plans', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockWorkoutApis(page);
		await loginAsUser(page);
	});
	afterEach(async () => { await context.close(); });

	it('renders a populated plan list with mocked workout data', async () => {
		const workout = new WorkoutPage(page);
		await workout.gotoList();
		await workout.planCards().first().waitFor({ state: 'visible' });
		expect(await workout.planCards().count()).to.equal(1);
		expect(await workout.planCards().first().textContent()).to.include('Push Day');
	});

	it('opens create-plan modal and validates required plan name', async () => {
		const workout = new WorkoutPage(page);
		await workout.gotoList();
		await workout.newPlanButton().click();
		await workout.createPlanModal().waitFor({ state: 'visible' });
		await workout.savePlanButton().click();
		const isInvalid = await workout.planNameInput().evaluate((el: HTMLInputElement) => !el.validity.valid);
		expect(isInvalid).to.be.true;
	});

	it('sends a create-plan request for a valid new plan', async () => {
		const workout = new WorkoutPage(page);
		await workout.gotoList();
		await workout.newPlanButton().click();
		await workout.planNameInput().fill(`KI Test Plan ${Date.now()}`);
		const [request] = await Promise.all([
			page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/workout-plans')),
			workout.savePlanButton().click()
		]);
		expect(request.method()).to.equal('POST');
	});

	it('starts a workout session from a plan card', async () => {
		const workout = new WorkoutPage(page);
		await workout.gotoList();
		await workout.startButtons().first().click();
		await page.waitForURL(/\/workouts\/.+\/start/);
		expect(page.url()).to.include('/start');
	});

	it('deleting a plan sends a DELETE request', async () => {
		const workout = new WorkoutPage(page);
		await workout.gotoList();
		const [request] = await Promise.all([
			page.waitForRequest(req => req.method() === 'DELETE' && req.url().includes('/workout-plans/plan-1')),
			workout.deleteButtons().first().click()
		]);
		expect(request.method()).to.equal('DELETE');
	});
});

describe('Workout: Empty And Access States', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});
	afterEach(async () => { await context.close(); });

	it('redirects unauthenticated users away from workouts', async () => {
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(url => url.pathname !== '/workouts');
		expect(page.url()).to.not.include('/workouts');
	});

	it('renders the German empty state when no workout plans exist', async () => {
		await mockWorkoutApis(page, []);
		await loginAsUser(page);
		const workout = new WorkoutPage(page);
		await workout.gotoList();
		await workout.emptyState().waitFor({ state: 'visible' });
		expect(await workout.emptyState().textContent()).to.include('Noch keine');
	});
});

describe('Workout: Session', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockWorkoutApis(page);
		await loginAsUser(page);
	});
	afterEach(async () => { await context.close(); });

	it('finishes the workout and returns to the workout list', async () => {
		const workout = new WorkoutPage(page);
		await workout.gotoSession('plan-1');
		await workout.finishButton().click();
		await page.waitForURL(/\/workouts$/);
		expect(page.url()).to.match(/\/workouts$/);
	});
});

