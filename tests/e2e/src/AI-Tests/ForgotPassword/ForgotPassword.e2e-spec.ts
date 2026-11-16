import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { LoginPage } from '../Login/LoginPage';

// API_URL may be provided as an origin ("https://docker:3000") or already include the
// "/api" prefix. Normalize so the prefix is always present exactly once.
const API_URL = `${(process.env.API_URL ?? 'http://localhost:3000').replace(/\/api\/?$/, '').replace(/\/$/, '')}/api`;

function uniqueEmail(): string {
	return `reset_${Date.now()}_${Math.random().toString(36).slice(2)}@example.test`;
}

async function createResetUser(page: Page, email = uniqueEmail(), password = 'Sonne-Kaffee-Wald-42!') {
	const response = await page.request.post(`${API_URL}/users`, {
		data: {
			email,
			firstName: 'Max',
			lastName: 'Reset',
			password,
			weight: 80,
			height: 180,
			birthDate: new Date('2000-01-01').getTime(),
			dailyCalorieGoal: 2200,
			dailyProteinGoal: 140,
			dailyFatGoal: 70,
			dailyCarbsGoal: 250,
			securityQuestionKey: 'first_pet',
			securityAnswer: 'Bello'
		}
	});
	expect(response.status()).to.equal(201);
	return { email, password, answer: 'Bello' };
}

async function getResetToken(page: Page, email: string, answer = 'Bello'): Promise<string> {
	const response = await page.request.post(`${API_URL}/auth/verify-security-answer`, {
		data: { email, answer }
	});
	expect(response.status()).to.equal(200);
	const json = await response.json();
	return json.token as string;
}

type ResetUser = { email: string; password: string; answer: string };

describe('Forgot password flow', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	// The registration endpoint is rate limited per IP, so non-destructive tests share a
	// small set of users created once here instead of registering a fresh user each time.
	// Only the tests that actually mutate a user (a successful reset / token consumption)
	// still create their own throwaway account.
	let sharedCorrectUser: ResetUser; // reused by tests that always answer correctly and never change the password
	let sharedWrongUser: ResetUser; // reused by the two wrong-answer tests (2 failures, well under the lockout of 5)

	before(async () => {
		browser = await getBrowser();

		const setupContext = await browser.newContext({ ignoreHTTPSErrors: true });
		const setupPage = await setupContext.newPage();
		try {
			sharedCorrectUser = await createResetUser(setupPage);
			sharedWrongUser = await createResetUser(setupPage);
		} finally {
			await setupContext.close();
		}
	});

	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});

	afterEach(async () => {
		await context.close();
	});

	it('loads the registered security question and accepts the correct answer', async () => {
		const user = sharedCorrectUser;
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.requestQuestion(user.email);
		expect(await forgot.questionText().textContent()).to.include('Wie hieß dein erstes Haustier?');

		await forgot.answer('  BELLO  ');
		await forgot.newPasswordInput().waitFor({ state: 'visible' });
		expect(await forgot.newPasswordInput().isVisible()).to.be.true;
	});

	it('shows a neutral error for a wrong security answer', async () => {
		const user = sharedWrongUser;
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.requestQuestion(user.email);
		await forgot.answer('Falsch');

		await forgot.errorMessage().waitFor({ state: 'visible' });
		expect(await forgot.errorMessage().textContent()).to.include('Die Angaben konnten nicht bestätigt werden.');
	});

	it('does not show the password step without a correct security answer', async () => {
		const user = sharedWrongUser;
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.requestQuestion(user.email);
		await forgot.answer('Falsch');
		await forgot.errorMessage().waitFor({ state: 'visible' });

		expect(await forgot.newPasswordInput().isVisible().catch(() => false)).to.equal(false);
	});

	it('rejects non-matching new passwords', async () => {
		const user = sharedCorrectUser;
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.requestQuestion(user.email);
		await forgot.answer(user.answer);
		await forgot.newPasswordInput().waitFor({ state: 'visible' });
		await forgot.resetPassword('Blume-Steine-Licht-57!', 'Anderes-Passwort-57!');

		await forgot.errorMessage().waitFor({ state: 'visible' });
		expect(await forgot.errorMessage().textContent()).to.include('Die Passwörter stimmen nicht überein.');
	});

	it('rejects passwords that violate the existing password rules', async () => {
		const user = sharedCorrectUser;
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.requestQuestion(user.email);
		await forgot.answer(user.answer);
		await forgot.newPasswordInput().waitFor({ state: 'visible' });
		await forgot.resetPassword('test', 'test');

		await forgot.errorMessage().waitFor({ state: 'visible' });
		expect(await forgot.errorMessage().textContent()).to.include('Das Passwort ist zu kurz.');
	});

	it('resets the password, rejects the old password, and accepts the new password', async () => {
		const user = await createResetUser(page);
		const newPassword = 'Blume-Steine-Licht-57!';
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.requestQuestion(user.email);
		await forgot.answer(user.answer);
		await forgot.newPasswordInput().waitFor({ state: 'visible' });
		await forgot.resetPassword(newPassword, newPassword);
		await forgot.successMessage().waitFor({ state: 'visible' });
		await page.waitForURL(url => url.pathname === '/login');

		const login = new LoginPage(page);
		await login.openSignIn();
		await login.fillCredentials(user.email, user.password);
		await login.submit();
		await login.errorMessage().waitFor({ state: 'visible' });
		expect(await login.errorMessage().textContent()).to.include('E-Mail-Adresse oder Passwort ist nicht korrekt.');

		await login.fillCredentials(user.email, newPassword);
		await login.submit();
		await page.waitForURL(url => url.pathname === '/profile');
		expect(page.url()).to.include('/profile');
	});

	it('rejects a reset token after it has already been used', async () => {
		const user = await createResetUser(page);
		const token = await getResetToken(page, user.email);
		const newPassword = 'Blume-Steine-Licht-57!';

		const first = await page.request.post(`${API_URL}/auth/reset-password`, {
			data: { token, newPassword, repeatPassword: newPassword }
		});
		expect(first.status()).to.equal(204);

		const second = await page.request.post(`${API_URL}/auth/reset-password`, {
			data: { token, newPassword: 'Wasser-Steine-Licht-58!', repeatPassword: 'Wasser-Steine-Licht-58!' }
		});
		expect(second.status()).to.equal(400);
	});

	it('rejects a manipulated reset token', async () => {
		const user = sharedCorrectUser;
		const token = await getResetToken(page, user.email);
		const forgot = new ForgotPasswordPage(page);

		await forgot.gotoWithToken(`${token}x`);
		await forgot.resetPassword('Blume-Steine-Licht-57!', 'Blume-Steine-Licht-57!');

		await forgot.errorMessage().waitFor({ state: 'visible' });
		expect(await forgot.errorMessage().textContent()).to.include('Das Passwort konnte nicht zurückgesetzt werden.');
	});
});
