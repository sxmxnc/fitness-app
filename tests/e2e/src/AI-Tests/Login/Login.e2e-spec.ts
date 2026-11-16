import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { loginAsAdmin, loginAsUser, USERS } from '../../Common/login';
import { LoginPage } from './LoginPage';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

describe('Login: Authentication', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => { browser = await getBrowser(); });
	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});
	afterEach(async () => { await context.close(); });

	it('regular user can log in successfully', async () => {
		await loginAsUser(page);
		await page.waitForURL(url => url.pathname === '/profile');
		expect(page.url()).to.include('/profile');
	});

	it('admin can log in successfully', async () => {
		await loginAsAdmin(page);
		await page.waitForURL(/\/admin\/overview/);
		expect(page.url()).to.include('/admin/overview');
	});

	it('shows German error for wrong password', async () => {
		const login = new LoginPage(page);
		await login.login(USERS.user2.email, 'WrongPassword123!');
		await login.errorMessage().waitFor({ state: 'visible' });
		expect(await login.errorMessage().textContent()).to.include('E-Mail-Adresse oder Passwort ist nicht korrekt.');
	});

	it('shows German error for unknown email', async () => {
		const login = new LoginPage(page);
		await login.login(`unknown_${Date.now()}@example.test`, USERS.user2.password);
		await login.errorMessage().waitFor({ state: 'visible' });
		expect(await login.errorMessage().textContent()).to.include('E-Mail-Adresse oder Passwort ist nicht korrekt.');
	});

	it('opens the forgot password page from the sign-in form', async () => {
		const login = new LoginPage(page);
		await login.goto();
		await login.openSignIn();
		await login.forgotPasswordLink().click();
		await page.waitForURL(url => url.pathname === '/forgot-password');
		await page.getByTestId('forgot-password-page').waitFor({ state: 'visible' });
	});

	it('disables submit until required fields are filled', async () => {
		const login = new LoginPage(page);
		await login.goto();
		await login.openSignIn();
		expect(await login.submitButton().isDisabled()).to.be.true;
		await login.emailInput().fill(USERS.user2.email);
		expect(await login.submitButton().isDisabled()).to.be.true;
		await login.passwordInput().fill(USERS.user2.password);
		expect(await login.submitButton().isEnabled()).to.be.true;
	});

	it('validates invalid email format with native input validity', async () => {
		const login = new LoginPage(page);
		await login.goto();
		await login.openSignIn();
		await login.fillCredentials('kein-email-format', USERS.user2.password);
		await login.submit();
		const isInvalid = await login.emailInput().evaluate((el: HTMLInputElement) => !el.validity.valid);
		expect(isInvalid).to.be.true;
	});

	it('protected profile route redirects unauthenticated users away', async () => {
		await page.goto(`${BASE_URL}/profile`);
		await page.waitForURL(url => url.pathname !== '/profile');
		expect(page.url()).to.not.include('/profile');
	});
});
