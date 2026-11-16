/**
 * Autor: Justus Heinz

 */
import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { loginAsUser } from '../../Common/login';
import {
	mockWorkoutApis,
	mockEmptyWorkoutApis,
	WorkoutListPage,
	WorkoutSessionPage
} from './WorkoutPage.js';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

describe('Workout: Access Control', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('redirects away from /workouts without auth token', async () => {
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(url => !url.pathname.includes('/workouts'), { timeout: 10000 });
		expect(page.url()).to.not.include('/workouts');
	});
});

describe('Workout: Rendering', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	let workoutList: WorkoutListPage;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		workoutList = new WorkoutListPage(page);
		await mockWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(/\/workouts$/, { timeout: 15000 });
	});
	afterEach(async () => { await context.close(); });

	it('renders the workout list page after login', async () => {
		expect(await workoutList.workoutList().isVisible()).to.be.true;
	});

	it('shows plan-card with plan name from mocked data', async () => {
		await workoutList.planCard().waitFor({ timeout: 10000 });
		const text = await workoutList.planCard().textContent();
		expect(text).to.include('Push Day');
	});
});

describe('Workout: Empty State', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	let workoutList: WorkoutListPage;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		workoutList = new WorkoutListPage(page);
		await mockEmptyWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(/\/workouts$/, { timeout: 15000 });
	});
	afterEach(async () => { await context.close(); });

	it('shows empty-state when no plans exist', async () => {
		await workoutList.emptyState().waitFor({ timeout: 10000 });
		expect(await workoutList.emptyState().isVisible()).to.be.true;
	});
});

describe('Workout: Modal', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	let workoutList: WorkoutListPage;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		workoutList = new WorkoutListPage(page);
		await mockWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(/\/workouts$/, { timeout: 15000 });
	});
	afterEach(async () => { await context.close(); });

	it('clicking new-plan-btn opens the create-plan-modal', async () => {
		await workoutList.newPlanBtn().click();
		await workoutList.createPlanModal().waitFor({ timeout: 5000 });
		expect(await workoutList.createPlanModal().isVisible()).to.be.true;
	});
});

describe('Workout: Navigation', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	let workoutList: WorkoutListPage;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		workoutList = new WorkoutListPage(page);
		await mockWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(/\/workouts$/, { timeout: 15000 });
	});
	afterEach(async () => { await context.close(); });

	it('start-btn navigates to the workout session URL', async () => {
		await workoutList.startBtn().waitFor({ timeout: 10000 });
		await workoutList.startBtn().click();
		await page.waitForURL(/\/workouts\/.+\/start/, { timeout: 10000 });
		expect(page.url()).to.include('/workouts/');
		expect(page.url()).to.include('/start');
	});
});

describe('Workout: Delete', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	let workoutList: WorkoutListPage;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		workoutList = new WorkoutListPage(page);
		await mockWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/workouts`);
		await page.waitForURL(/\/workouts$/, { timeout: 15000 });
	});
	afterEach(async () => { await context.close(); });

	it('delete-plan-btn triggers a DELETE request to the API', async () => {
		await workoutList.deletePlanBtn().waitFor({ timeout: 10000 });
		const [deleteRequest] = await Promise.all([
			page.waitForRequest(
				req => req.method() === 'DELETE' && req.url().includes('/workout-plans/plan-1'),
				{ timeout: 10000 }
			),
			workoutList.deletePlanBtn().click()
		]);
		expect(deleteRequest.method()).to.equal('DELETE');
	});
});

describe('Workout: Session', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;
	let workoutSession: WorkoutSessionPage;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		workoutSession = new WorkoutSessionPage(page);
		await mockWorkoutApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/workouts/plan-1/start`);
		await page.waitForURL(/\/workouts\/plan-1\/start/, { timeout: 15000 });
		await workoutSession.exercisesList().waitFor({ timeout: 15000 });
	});
	afterEach(async () => { await context.close(); });

	it('workout session page renders timer and exercises-list', async () => {
		expect(await workoutSession.timer().isVisible()).to.be.true;
		expect(await workoutSession.exercisesList().isVisible()).to.be.true;
	});

	it('add-set-btn adds a new set-row', async () => {
		const before = await workoutSession.setRows().count();
		await workoutSession.addSetBtn().click();
		const deadline = Date.now() + 5000;
		let count = await workoutSession.setRows().count();
		while (count !== before + 1 && Date.now() < deadline) {
			await page.waitForTimeout(100);
			count = await workoutSession.setRows().count();
		}
		expect(count).to.equal(before + 1);
	});

	it('finish-btn completes the workout and redirects to /workouts', async () => {
		await workoutSession.finishBtn().waitFor({ timeout: 10000 });
		await workoutSession.finishBtn().click();
		await page.waitForURL(/\/workouts$/, { timeout: 15000 });
		expect(page.url()).to.match(/\/workouts$/);
	});
});
