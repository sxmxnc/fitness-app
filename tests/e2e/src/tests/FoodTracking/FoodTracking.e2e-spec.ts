/**
 * Autor: Simon Josef Cebula

 */
import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { FoodTrackingPage } from './FoodTrackingPage';
import { loginAsUser } from '../../Common/login';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

const MOCK_SUMMARY = {
	period: 'daily',
	from: Date.now(),
	to: Date.now(),
	totalCalories: 1850,
	totalProtein: 120,
	totalFat: 65,
	totalCarbs: 210,
	breakdown: []
};

async function mockFoodApis(page: Page): Promise<void> {
	await page.route('**/food/*/summary**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SUMMARY) })
	);
	await page.route('**/food/*/foods', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/food/*/entries**', route =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
	await page.route('**/users/data/**', route =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ dailyCalorieGoal: 2000, dailyProteinGoal: 150, dailyFatGoal: 65, dailyCarbsGoal: 200 })
		})
	);
}

// ---------------------------------------------------------------------------
// Access Control
// ---------------------------------------------------------------------------

describe('FoodTracking: Access Control', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('redirects to home without auth token', async () => {
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(url => !url.pathname.includes('/foodtracking'), { timeout: 10000 });
		expect(page.url()).to.not.include('/foodtracking');
	});
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('FoodTracking: Rendering', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);
	});
	afterEach(async () => { await context.close(); });

	it('renders the summary card', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.summaryCard().waitFor({ state: 'attached' });
	});

	it('renders all four period tabs', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.periodTabDaily().waitFor({ state: 'visible' });
		await fp.periodTabWeekly().waitFor({ state: 'visible' });
		await fp.periodTabMonthly().waitFor({ state: 'visible' });
		await fp.periodTabYearly().waitFor({ state: 'visible' });
	});

	it('daily tab is active by default', async () => {
		const fp = new FoodTrackingPage(page);
		await page.locator('[data-testid="food-summary-tab-daily"].active').waitFor({ timeout: 5000 });
		expect(await fp.periodTabDaily().getAttribute('class')).to.include('active');
		expect(await fp.periodTabWeekly().getAttribute('class') ?? '').to.not.include('active');
	});

	it('shows calories from mocked summary', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.summaryCalories().waitFor({ state: 'visible' });
		expect(await fp.summaryCalories().textContent()).to.include('1850');
	});

	it('FAB button is visible', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.fab().waitFor({ state: 'visible' });
	});
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('FoodTracking: Interactions', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);
	});
	afterEach(async () => { await context.close(); });

	it('clicking weekly tab makes it active', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.periodTabWeekly().click();
		await page.locator('[data-testid="food-summary-tab-weekly"].active').waitFor({ timeout: 5000 });
		expect(await fp.periodTabWeekly().getAttribute('class')).to.include('active');
		expect(await fp.periodTabDaily().getAttribute('class') ?? '').to.not.include('active');
	});

	it('clicking FAB opens the entry form', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.fab().click();
		await fp.entryForm().waitFor({ state: 'attached' });
	});

	it('form closes when the X button is clicked', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.fab().click();
		await fp.entryForm().waitFor({ state: 'attached' });
		await fp.entryFormCloseBtn().click();
		await fp.entryForm().waitFor({ state: 'detached' });
	});
});

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

describe('FoodTracking: Error State', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('shows error state when summary API returns 500', async () => {
		await page.route('**/food/*/summary**', route =>
			route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal Server Error' }) })
		);
		await page.route('**/food/*/foods', route =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
		);
		await page.route('**/food/*/entries**', route =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
		);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);
		await page.locator('app-foodtracking').locator('.error-state').waitFor({ state: 'visible' });
	});
});

// ---------------------------------------------------------------------------
// Period Tabs Extended
// ---------------------------------------------------------------------------

describe('FoodTracking: Period Tabs Extended', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);
	});
	afterEach(async () => { await context.close(); });

	it('clicking monthly tab makes it active', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.periodTabMonthly().click();
		await page.locator('[data-testid="food-summary-tab-monthly"].active').waitFor({ timeout: 5000 });
		expect(await fp.periodTabMonthly().getAttribute('class')).to.include('active');
		expect(await fp.periodTabDaily().getAttribute('class') ?? '').to.not.include('active');
	});

	it('clicking yearly tab makes it active', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.periodTabYearly().click();
		await page.locator('[data-testid="food-summary-tab-yearly"].active').waitFor({ timeout: 5000 });
		expect(await fp.periodTabYearly().getAttribute('class')).to.include('active');
		expect(await fp.periodTabDaily().getAttribute('class') ?? '').to.not.include('active');
	});
});

// ---------------------------------------------------------------------------
// API Requests
// ---------------------------------------------------------------------------

describe('FoodTracking: API Requests', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('clicking weekly tab triggers API request with period=weekly', async () => {
		await mockFoodApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);

		const fp = new FoodTrackingPage(page);
		const [request] = await Promise.all([
			page.waitForRequest(req => req.url().includes('period=weekly')),
			fp.periodTabWeekly().click()
		]);
		expect(request.url()).to.include('period=weekly');
	});
});

// ---------------------------------------------------------------------------
// Summary Details
// ---------------------------------------------------------------------------

describe('FoodTracking: Summary Details', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);
	});
	afterEach(async () => { await context.close(); });

	it('summary macros section is visible', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.summaryMacros().waitFor({ state: 'visible' });
	});
});

// ---------------------------------------------------------------------------
// Entry Form Details
// ---------------------------------------------------------------------------

describe('FoodTracking: Entry Form Details', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodApis(page);
		await loginAsUser(page);
		await page.goto(`${BASE_URL}/foodtracking`);
		await page.waitForURL(/\/foodtracking/);
		const fp = new FoodTrackingPage(page);
		await fp.fab().click();
		await fp.entryForm().waitFor({ state: 'attached' });
	});
	afterEach(async () => { await context.close(); });

	it('form shows four meal type buttons', async () => {
		const fp = new FoodTrackingPage(page);
		expect(await fp.entryFormMealTypeBtns().count()).to.equal(4);
	});

	it('form shows mode toggle buttons', async () => {
		const fp = new FoodTrackingPage(page);
		expect(await fp.entryFormModeBtns().count()).to.equal(2);
	});

	it('quantity input has default value of 100', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.entryFormQuantityInput().waitFor({ state: 'visible' });
		expect(await fp.entryFormQuantityInput().inputValue()).to.equal('100');
	});

	it('clicking the overlay area closes the form', async () => {
		const fp = new FoodTrackingPage(page);
		await fp.entryFormOverlay().evaluate((el: Element) =>
			el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))
		);
		await fp.entryForm().waitFor({ state: 'detached' });
	});
});
