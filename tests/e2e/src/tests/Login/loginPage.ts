/**
 * Autor: Luca Lammers

 */
import { Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class LoginPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(`${BASE_URL}/login`);
	}

	async clickSignIn() {
		await this.page.getByTestId('login-choose-signin-btn').click();
	}

	get submitButton() {
		return this.page.getByTestId('login-signin-submit-btn');
	}

	async fillEmail(email: string) {
		await this.page.getByTestId('login-signin-email-input').fill(email);
	}

	async fillPassword(password: string) {
		await this.page.getByTestId('login-signin-password-input').fill(password);
	}

	async submit() {
		await this.page.getByTestId('login-signin-submit-btn').click();
	}

	async login(email: string, password: string) {
		await this.goto();
		await this.clickSignIn();
		await this.fillEmail(email);
		await this.fillPassword(password);
		await this.submit();
	}

	errorBox() {
		return this.page.getByTestId('login-signin-error-msg');
	}
}
