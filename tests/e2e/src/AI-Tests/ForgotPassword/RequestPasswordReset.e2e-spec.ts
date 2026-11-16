import { Browser, BrowserContext, Page } from 'playwright';
import { expect } from 'chai';
import { getBrowser } from '../../Common/browser';
import { ForgotPasswordPage } from './ForgotPasswordPage';

// API_URL may be provided as an origin ("https://docker:3000") or already include the
// "/api" prefix. Normalize so the prefix is always present exactly once.
const API_URL = `${(process.env.API_URL ?? 'http://localhost:3000').replace(/\/api\/?$/, '').replace(/\/$/, '')}/api`;

// Seeded demo accounts (see api-server/db/user_demoData.sql).
const LEGACY_EMAIL = 'legacy@example.test'; // exists but has NO security question -> 404
const QUESTION_EMAIL = 'example2@example.test'; // exists with the "birth_city" question -> 200

function unknownEmail(): string {
	return `nobody_${Date.now()}_${Math.random().toString(36).slice(2)}@example.test`;
}

describe('Request password reset – security question availability', () => {
	let browser: Browser;
	let context: BrowserContext;
	let page: Page;

	before(async () => {
		browser = await getBrowser();
	});

	beforeEach(async () => {
		context = await browser.newContext({ ignoreHTTPSErrors: true });
		page = await context.newPage();
	});

	afterEach(async () => {
		await context.close();
	});

	it('returns 404 with an error message when the account has no security question', async () => {
		const res = await page.request.post(`${API_URL}/auth/request-password-reset`, {
			data: { email: LEGACY_EMAIL }
		});

		expect(res.status()).to.equal(404);
		const json = await res.json();
		expect(json.detail).to.include('keine Sicherheitsfrage');
	});

	it('returns 200 with the security question when the account has one set up', async () => {
		const res = await page.request.post(`${API_URL}/auth/request-password-reset`, {
			data: { email: QUESTION_EMAIL }
		});

		expect(res.status()).to.equal(200);
		const json = await res.json();
		expect(json.question).to.include('In welcher Stadt wurdest du geboren?');
	});

	it('does not reveal whether an unknown email exists (200, no question, never 404)', async () => {
		const res = await page.request.post(`${API_URL}/auth/request-password-reset`, {
			data: { email: unknownEmail() }
		});

		// Anti-enumeration: unknown accounts must look identical to a generic miss, not 404.
		expect(res.status()).to.equal(200);
		const json = await res.json();
		expect(json.question).to.equal(null);
	});

	it('shows a generic error and no question step in the UI for an account without a security question', async () => {
		const forgot = new ForgotPasswordPage(page);

		await forgot.goto();
		await forgot.emailInput().fill(LEGACY_EMAIL);
		await forgot.requestQuestionButton().click();

		await forgot.errorMessage().waitFor({ state: 'visible' });
		expect(await forgot.errorMessage().textContent()).to.include(
			'Das Konto konnte nicht gefunden oder nicht zurückgesetzt werden.'
		);
		// The flow must not advance to the security-question step.
		expect(await forgot.questionText().isVisible().catch(() => false)).to.equal(false);
	});
});
