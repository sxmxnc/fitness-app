/**
 * Autor: Simon Josef Cebula

 */
import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { AdminFoodTrackingPage } from './AdminFoodTrackingPage';
import { loginAsAdmin } from '../../Common/login';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

const MOCK_FOODS = [
	{ id: '1', name: 'Hähnchenbrust', caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 4, carbsPer100g: 0, isSystemEntity: true },
	{ id: '2', name: 'Lachs', caloriesPer100g: 208, proteinPer100g: 20, fatPer100g: 13, carbsPer100g: 0, isSystemEntity: false }
];

async function mockFoodsApi(page: Page, foods = MOCK_FOODS): Promise<void> {
	await page.route('**/admin/foods', route => {
		if (route.request().method() === 'GET') {
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(foods) }).catch(() => {});
		} else {
			route.continue().catch(() => {});
		}
	});
}

// ---------------------------------------------------------------------------
// Access Control
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Access Control', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('unauthenticated user is redirected away from admin foodtracking', async () => {
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(url => !url.pathname.includes('/admin/foodtracking'), { timeout: 10000 });
		expect(page.url()).to.not.include('/admin/foodtracking');
	});
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Rendering', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodsApi(page);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
	});
	afterEach(async () => { await context.close(); });

	it('food list is visible after loading', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.foodList().waitFor({ state: 'visible' });
	});

	it('correct number of food rows is rendered', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.foodRows().first().waitFor({ state: 'visible' });
		expect(await ap.foodRows().count()).to.equal(2);
	});

	it('search input is visible', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.searchInput().waitFor({ state: 'visible' });
	});

	it('new food button is visible', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.newFoodBtn().waitFor({ state: 'visible' });
	});
});

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Empty State', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('shows empty state when no foods exist', async () => {
		await mockFoodsApi(page, []);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
		const ap = new AdminFoodTrackingPage(page);
		await ap.emptyState().waitFor({ state: 'visible' });
	});
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Interactions', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodsApi(page);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
		const ap = new AdminFoodTrackingPage(page);
		await ap.firstDeleteBtn().click();
		await ap.confirmOverlay().waitFor({ state: 'visible' });
	});
	afterEach(async () => { await context.close(); });

	it('clicking delete shows the confirm dialog with food name', async () => {
		const ap = new AdminFoodTrackingPage(page);
		expect(await ap.confirmTitle().textContent()).to.include('Hähnchenbrust');
	});

	it('clicking cancel in confirm dialog hides the dialog', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.confirmCancelBtn().click();
		await ap.confirmOverlay().waitFor({ state: 'hidden' });
	});
});

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Sort', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodsApi(page);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
	});
	afterEach(async () => { await context.close(); });

	it('all four sort pills are visible', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.sortPill('name-asc').waitFor({ state: 'visible' });
		await ap.sortPill('name-desc').waitFor({ state: 'visible' });
		await ap.sortPill('cal-asc').waitFor({ state: 'visible' });
		await ap.sortPill('cal-desc').waitFor({ state: 'visible' });
	});

	it('name-asc sort pill is active by default', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await page.locator('[data-testid="foodtracking-sort-name-asc-btn"].active').waitFor({ timeout: 5000 });
		expect(await ap.sortPill('name-asc').getAttribute('class')).to.include('active');
		expect(await ap.sortPill('cal-asc').getAttribute('class') ?? '').to.not.include('active');
	});

	it('clicking cal-asc makes it the active sort', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.sortPill('cal-asc').click();
		await page.locator('[data-testid="foodtracking-sort-cal-asc-btn"].active').waitFor({ timeout: 5000 });
		expect(await ap.sortPill('cal-asc').getAttribute('class')).to.include('active');
		expect(await ap.sortPill('name-asc').getAttribute('class') ?? '').to.not.include('active');
	});
});

// ---------------------------------------------------------------------------
// Create Modal
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Create Modal', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodsApi(page);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
		const ap = new AdminFoodTrackingPage(page);
		await ap.newFoodBtn().click();
	});
	afterEach(async () => { await context.close(); });

	it('clicking new food button opens the create modal', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.createModal().waitFor({ state: 'attached' });
	});

	it('create modal has a name input', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.createModalNameInput().waitFor({ state: 'visible' });
	});
});

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Edit Modal', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
		await mockFoodsApi(page);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
		const ap = new AdminFoodTrackingPage(page);
		await ap.firstEditBtn().click();
	});
	afterEach(async () => { await context.close(); });

	it('clicking edit button opens the edit modal', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.editModal().waitFor({ state: 'attached' });
	});

	it('edit modal name input contains the food name', async () => {
		const ap = new AdminFoodTrackingPage(page);
		await ap.editModalNameInput().waitFor({ state: 'visible' });
		expect(await ap.editModalNameInput().inputValue()).to.equal('Hähnchenbrust');
	});
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: Search', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('typing in search filters visible food rows', async () => {
		await mockFoodsApi(page);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
		const ap = new AdminFoodTrackingPage(page);
		await ap.foodRows().first().waitFor({ state: 'visible' });
		expect(await ap.foodRows().count()).to.equal(2);
		await ap.searchInput().fill('Lachs');
		// Playwright locators pierce Shadow DOM; poll until Lit re-renders the filtered list
		const deadline = Date.now() + 5000;
		let rowCount = await ap.foodRows().count();
		while (rowCount !== 1 && Date.now() < deadline) {
			await page.waitForTimeout(150);
			rowCount = await ap.foodRows().count();
		}
		expect(rowCount).to.equal(1);
	});
});

// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------

describe('AdminFoodTracking: API Error', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
	afterEach(async () => { await context.close(); });

	it('shows error message when API returns 500', async () => {
		await page.route('**/admin/foods', route =>
			route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal Server Error' }) })
		);
		await loginAsAdmin(page);
		await page.goto(`${BASE_URL}/admin/foodtracking`);
		await page.waitForURL(/\/admin\/foodtracking/);
		const ap = new AdminFoodTrackingPage(page);
		await ap.errorMsg().waitFor({ state: 'visible' });
	});
});
