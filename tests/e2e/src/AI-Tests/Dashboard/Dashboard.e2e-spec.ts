import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { loginAsUser } from '../../Common/login';
import { DashboardPage } from './DashboardPage';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';
const TODAY = new Date().toISOString().slice(0, 10);

type ActivityDay = { day: string; count: number };
type ExerciseDay = { day: string; sessions: { planName: string | null; durationSeconds: number }[] };
type FoodBreakdownDay = { date: number; calories: number; protein: number; fat: number; carbs: number };

const MOCK_ACTIVITY: ActivityDay[] = [{ day: TODAY, count: 2 }];
const MOCK_EXERCISE_STATS: ExerciseDay[] = [{ day: TODAY, sessions: [{ planName: 'Push Day', durationSeconds: 900 }] }];
const MOCK_SUMMARY: { breakdown: FoodBreakdownDay[] } = {
	breakdown: [
		{ date: Date.now() - 86_400_000, calories: 1900, protein: 120, fat: 60, carbs: 220 },
		{ date: Date.now(), calories: 2100, protein: 150, fat: 70, carbs: 240 }
	]
};
const MOCK_USER_DATA = { dailyCalorieGoal: 2200, dailyProteinGoal: 140 };

async function mockDashboardApis(page: Page): Promise<void> {
	await page.route('**/usersStats/*/activity**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ACTIVITY) })
	);
	await page.route('**/workout-sessions/stats/by-day**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXERCISE_STATS) })
	);
	await page.route('**/food/*/summary**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SUMMARY) })
	);
	await page.route('**/users/data/**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER_DATA) })
	);
}

describe('Dashboard: User Stats', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockDashboardApis(page);
		await loginAsUser(page);
	});
	afterEach(async () => { await context.close(); });

	it('renders all stats widgets for an authenticated user', async () => {
		const dashboard = new DashboardPage(page);
		await dashboard.goto();
		await dashboard.activityHeatmap().waitFor({ state: 'visible' });
		await dashboard.exerciseHeatmap().waitFor({ state: 'visible' });
		await dashboard.foodChartCard().waitFor({ state: 'visible' });
		expect(await dashboard.dashboard().textContent()).to.include('Training');
	});

	it('renders food chart canvases after mocked summary data loads', async () => {
		const dashboard = new DashboardPage(page);
		await dashboard.goto();
		await dashboard.foodChartLoadingState().waitFor({ state: 'hidden' });
		await dashboard.caloriesCanvas().waitFor({ state: 'attached' });
		await dashboard.proteinCanvas().waitFor({ state: 'attached' });
		expect(await dashboard.foodChartCard().textContent()).to.include('Protein');
	});

	it('switching to month view triggers a monthly summary request', async () => {
		const dashboard = new DashboardPage(page);
		await dashboard.goto();
		await dashboard.monthlyTab().waitFor({ state: 'visible' });
		const [request] = await Promise.all([
			page.waitForRequest(req => req.url().includes('period=monthly')),
			dashboard.monthlyTab().click()
		]);
		expect(request.url()).to.include('period=monthly');
	});
});

describe('Dashboard: Access And Error States', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});
	afterEach(async () => { await context.close(); });

	it('redirects unauthenticated users away from /stats', async () => {
		await page.goto(`${BASE_URL}/stats`);
		await page.waitForURL(url => url.pathname !== '/stats');
		expect(page.url()).to.not.include('/stats');
	});

	it('keeps dashboard usable when stats APIs return empty or 500 responses', async () => {
		await page.route('**/usersStats/*/activity**', route =>
			route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Fehler' }) })
		);
		await page.route('**/workout-sessions/stats/by-day**', route =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
		);
		await page.route('**/food/*/summary**', route =>
			route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Fehler' }) })
		);
		await page.route('**/users/data/**', route =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
		);
		await loginAsUser(page);
		const dashboard = new DashboardPage(page);
		await dashboard.goto();
		await dashboard.activityHeatmap().waitFor({ state: 'visible' });
		await dashboard.exerciseHeatmap().waitFor({ state: 'visible' });
		await dashboard.foodChartCard().waitFor({ state: 'visible' });
	});
});
