import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { loginAsAdmin, loginAsUser } from '../../Common/login';
import { AdminWorkoutPage } from './AdminWorkoutPage';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

type SystemExercise = {
	id: string;
	name: string;
	type: 'weighted' | 'bodyweight' | 'cardio';
	description: string | null;
	muscleGroup: string | null;
};

type SystemPlan = {
	id: string;
	name: string;
	description: string | null;
	exercises: { id: string; exerciseId: string; exerciseOrder: number; targetSets: number | null; targetReps: number | null; targetWeight: number | null; targetDurationMinutes: number | null }[];
};

const MOCK_EXERCISES: SystemExercise[] = [
	{ id: 'ex-1', name: 'Bankdruecken', type: 'weighted', description: null, muscleGroup: 'Brust' },
	{ id: 'ex-2', name: 'Kniebeuge', type: 'weighted', description: null, muscleGroup: 'Beine' }
];

const MOCK_PLANS: SystemPlan[] = [
	{
		id: 'classic-1',
		name: 'Classic Push',
		description: 'Brust und Schulter',
		exercises: [{ id: 'pe-1', exerciseId: 'ex-1', exerciseOrder: 1, targetSets: 3, targetReps: 10, targetWeight: 60, targetDurationMinutes: null }]
	}
];

async function mockAdminWorkoutApis(page: Page, exercises = MOCK_EXERCISES, plans = MOCK_PLANS): Promise<void> {
	await page.route('**/auth/verify', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
	);
	await page.route('**/admin/exercises', route => {
		if (route.request().method() === 'GET') {
			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(exercises) });
		}
		return route.fulfill({
			status: 201,
			contentType: 'application/json',
			body: JSON.stringify({ id: `ex-${Date.now()}`, name: 'KI Uebung', type: 'weighted', description: null, muscleGroup: null })
		});
	});
	await page.route('**/admin/exercises/**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
	);
	await page.route('**/admin/workout-plans', route => {
		if (route.request().method() === 'GET') {
			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plans) });
		}
		return route.fulfill({
			status: 201,
			contentType: 'application/json',
			body: JSON.stringify({ id: `classic-${Date.now()}`, name: 'KI Classic Plan', description: null, exercises: [] })
		});
	});
	await page.route('**/admin/workout-plans/**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
	);
}

describe('Admin Workouts: Exercises', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockAdminWorkoutApis(page);
		await loginAsAdmin(page);
	});
	afterEach(async () => { await context.close(); });

	it('renders system exercises for admins', async () => {
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.exerciseRows().first().waitFor({ state: 'visible' });
		expect(await adminWorkout.exerciseRows().count()).to.equal(2);
		expect(await adminWorkout.adminWorkouts().textContent()).to.include('System');
	});

	it('filters exercises by search text', async () => {
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.searchInput().fill('Knie');
		await expectEventually(async () => {
			expect(await adminWorkout.exerciseRows().count()).to.equal(1);
		});
		expect(await adminWorkout.exerciseRows().first().textContent()).to.include('Kniebeuge');
	});

	it('shows German empty state when no exercises match search', async () => {
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.searchInput().fill('GibtEsNicht');
		await adminWorkout.emptyState().waitFor({ state: 'visible' });
		expect(await adminWorkout.emptyState().textContent()).to.include('Keine');
	});

	it('validates required exercise name in the create dialog', async () => {
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.newExerciseButton().click();
		await adminWorkout.createDialog().waitFor({ state: 'visible' });
		await adminWorkout.createSubmitButton().click();
		await adminWorkout.createError().waitFor({ state: 'visible' });
		expect(await adminWorkout.createError().textContent()).to.include('Name ist erforderlich.');
	});

	it('creates a new system exercise through the API', async () => {
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.newExerciseButton().click();
		await adminWorkout.createNameInput().fill(`KI Uebung ${Date.now()}`);
		const [request] = await Promise.all([
			page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/admin/exercises')),
			adminWorkout.createSubmitButton().click()
		]);
		expect(request.method()).to.equal('POST');
	});

	it('opens delete confirmation and cancel keeps the exercise visible', async () => {
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.firstDeleteButton().click();
		await adminWorkout.confirmOverlay().waitFor({ state: 'visible' });
		expect(await adminWorkout.confirmOverlay().textContent()).to.include('schen');
		await adminWorkout.confirmCancelButton().click();
		await adminWorkout.confirmOverlay().waitFor({ state: 'hidden' });
		expect(await adminWorkout.exerciseRows().count()).to.equal(2);
	});
});

describe('Admin Workouts: Plans And Access', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});
	afterEach(async () => { await context.close(); });

	it('renders classic workout plans on the plans tab', async () => {
		await mockAdminWorkoutApis(page);
		await loginAsAdmin(page);
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.adminWorkouts().getByRole('button', { name: /Workout/ }).click();
		await adminWorkout.planRows().first().waitFor({ state: 'visible' });
		expect(await adminWorkout.planRows().first().textContent()).to.include('Classic Push');
	});

	it('shows exercise API error state when the admin endpoint fails', async () => {
		await page.route('**/auth/verify', route =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
		);
		await page.route('**/admin/exercises', route =>
			route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Fehler' }) })
		);
		await page.route('**/admin/workout-plans', route =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PLANS) })
		);
		await loginAsAdmin(page);
		const adminWorkout = new AdminWorkoutPage(page);
		await adminWorkout.goto();
		await adminWorkout.errorMessage().waitFor({ state: 'visible' });
		expect(await adminWorkout.errorMessage().textContent()).to.include('konnten nicht geladen werden');
	});

	it('redirects unauthenticated users away from admin workouts', async () => {
		await page.goto(`${BASE_URL}/admin/workouts`);
		await page.waitForURL(/\/login/);
		expect(page.url()).to.include('/login');
	});

	it('redirects regular users away from admin workouts', async () => {
		await mockAdminWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/admin/workouts`);
		await page.waitForURL(/\/login/);
		expect(page.url()).to.include('/login');
	});
});

async function expectEventually(assertion: () => Promise<void>): Promise<void> {
	const deadline = Date.now() + 5000;
	let lastError: unknown;
	while (Date.now() < deadline) {
		try {
			await assertion();
			return;
		} catch (error) {
			lastError = error;
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}
	throw lastError;
}
