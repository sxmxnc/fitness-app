import { Locator, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class ForgotPasswordPage {
	constructor(private page: Page) {}

	pageRoot(): Locator {
		return this.page.getByTestId('forgot-password-page');
	}

	emailInput(): Locator {
		return this.page.getByTestId('forgot-email-input');
	}

	requestQuestionButton(): Locator {
		return this.page.getByTestId('forgot-request-question-btn');
	}

	questionText(): Locator {
		return this.page.getByTestId('forgot-security-question');
	}

	answerInput(): Locator {
		return this.page.getByTestId('forgot-answer-input');
	}

	verifyAnswerButton(): Locator {
		return this.page.getByTestId('forgot-verify-answer-btn');
	}

	newPasswordInput(): Locator {
		return this.page.getByTestId('forgot-new-password-input');
	}

	repeatPasswordInput(): Locator {
		return this.page.getByTestId('forgot-repeat-password-input');
	}

	resetPasswordButton(): Locator {
		return this.page.getByTestId('forgot-reset-password-btn');
	}

	errorMessage(): Locator {
		return this.page.getByTestId('forgot-error-msg');
	}

	successMessage(): Locator {
		return this.page.getByTestId('forgot-success-msg');
	}

	async goto() {
		await this.page.goto(`${BASE_URL}/forgot-password`);
		await this.pageRoot().waitFor({ state: 'visible' });
	}

	async gotoWithToken(token: string) {
		await this.page.goto(`${BASE_URL}/forgot-password?token=${encodeURIComponent(token)}`);
		await this.pageRoot().waitFor({ state: 'visible' });
	}

	async requestQuestion(email: string) {
		await this.emailInput().fill(email);
		await this.requestQuestionButton().click();
		await this.questionText().waitFor({ state: 'visible' });
	}

	async answer(answer: string) {
		await this.answerInput().fill(answer);
		await this.verifyAnswerButton().click();
	}

	async fillNewPassword(newPassword: string, repeatPassword: string) {
		await this.newPasswordInput().fill(newPassword);
		await this.repeatPasswordInput().fill(repeatPassword);
	}

	async resetPassword(newPassword: string, repeatPassword: string) {
		await this.fillNewPassword(newPassword, repeatPassword);
		await this.resetPasswordButton().click();
	}
}
