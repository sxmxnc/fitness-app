import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { LandingPage } from './LandingPage';

describe('Landing: Public Home', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});
	afterEach(async () => { await context.close(); });

	it('renders hero, feature, preview and footer sections', async () => {
		const landing = new LandingPage(page);
		await landing.goto();
		await landing.features().waitFor({ state: 'visible' });
		await landing.preview().waitFor({ state: 'visible' });
		await landing.footer().waitFor({ state: 'visible' });
		expect(await landing.hero().textContent()).to.include('Food');
	});

	it('hero start button navigates to the German login flow', async () => {
		const landing = new LandingPage(page);
		await landing.goto();
		await landing.heroStartButton().click();
		await page.waitForURL(/\/login/);
		expect(page.url()).to.include('/login');
	});

	it('GitHub project button points to the repository target', async () => {
		const landing = new LandingPage(page);
		await landing.goto();
		const href = await landing.heroProjectButton().locator('..').getAttribute('href');
		expect(href).to.include('github.com/sxmxnc/fitness-app');
	});
});
