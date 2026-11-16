import { Locator, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class LoginPage {
	constructor(private page: Page) {}

	loginPage(): Locator {
		return this.page.getByTestId('login-page');
	}

	loginCard(): Locator {
		return this.page.getByTestId('login-card');
	}

	signInChoiceButton(): Locator {
		return this.page.getByTestId('login-choose-signin-btn');
	}

	signInBackButton(): Locator {
		return this.page.getByTestId('login-signin-back-btn');
	}

	emailInput(): Locator {
		return this.page.getByTestId('login-signin-email-input');
	}

	passwordInput(): Locator {
		return this.page.getByTestId('login-signin-password-input');
	}

	submitButton(): Locator {
		return this.page.getByTestId('login-signin-submit-btn');
	}

	errorMessage(): Locator {
		return this.page.getByTestId('login-signin-error-msg');
	}

	forgotPasswordLink(): Locator {
		return this.page.getByTestId('login-forgot-password-link');
	}

	cardTitle(): Locator {
		return this.loginCard().locator('h1.card-title');
	}

	async goto() {
		await this.page.goto(`${BASE_URL}/login`);
		await this.loginPage().waitFor({ state: 'visible' });
	}

	async openSignIn() {
		await this.signInChoiceButton().click();
		await this.emailInput().waitFor({ state: 'visible' });
	}

	async fillCredentials(email: string, password: string) {
		await this.emailInput().fill(email);
		await this.passwordInput().fill(password);
	}

	async submit() {
		await this.submitButton().click();
	}

	async login(email: string, password: string) {
		await this.goto();
		await this.openSignIn();
		await this.fillCredentials(email, password);
		await this.submit();
	}
}
