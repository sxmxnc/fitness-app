import { Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class SignUpPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto(`${BASE_URL}/login`);
		await this.page.waitForLoadState('networkidle');
	}

	async clickSignUp() {
		await this.page.getByTestId('login-choose-register-btn').click();
	}

  async clickBacklink() {
    await this.page.locator('.back-link').click();
  }

  getCardTitle() {
    return this.page.locator('h1.card-title');
  }

	async fillEmail(email: string) {
		await this.page.getByTestId('login-signup-email-input').fill(email);
	}

	async fillPassword(password: string) {
		await this.page.getByTestId('login-signup-password-input').fill(password);
	}

	async fillFirstname(firstName: string) {
		await this.page.getByTestId('login-signup-firstname-input').fill(firstName);
	}

	async fillLasttname(LastName: string) {
		await this.page.getByTestId('login-signup-lastname-input').fill(LastName);
	}

	async fillweight(weight: string) {
		await this.page
			.getByTestId('login-signup-weight-input')
			.evaluate((el: HTMLInputElement, v) => (el.value = v), weight);
	}

	async fillheight(height: string) {
		await this.page
			.getByTestId('login-signup-height-input')
			.evaluate((el: HTMLInputElement, v) => (el.value = v), height);
	}

	async fillbirthdate(birthdate: string) {
		await this.page.getByTestId('login-signup-birthdate-input').fill(birthdate);
	}

	async fillcalories(calories: string) {
		await this.page
			.getByTestId('login-signup-calorie-input')
			.evaluate((el: HTMLInputElement, v) => (el.value = v), calories);
	}

	async fillprotein(protein: string) {
		await this.page
			.getByTestId('login-signup-protein-input')
			.evaluate((el: HTMLInputElement, v) => (el.value = v), protein);
	}

	async fillfat(fat: string) {
		await this.page
			.getByTestId('login-signup-fat-input')
			.evaluate((el: HTMLInputElement, v) => (el.value = v), fat);
	}

	async fillcarbs(carbs: string) {
		await this.page
			.getByTestId('login-signup-carbs-input')
			.evaluate((el: HTMLInputElement, v) => (el.value = v), carbs);
	}

	async continue() {
		await this.page.getByTestId('login-signup-email-continue-btn').click();
	}

	async submit() {
		const securitySubmit = this.page.getByTestId('login-signup-security-submit-btn');
		if (await securitySubmit.isVisible().catch(() => false)) {
			await securitySubmit.click();
			return;
		}

		await this.page.getByTestId('login-signup-submit-btn').click();
		if (await securitySubmit.isVisible({ timeout: 2000 }).catch(() => false)) {
			await this.selectSecurityQuestion('first_pet');
			await this.fillSecurityAnswer('Bello');
			await securitySubmit.click();
		}
	}

	async submitProfileStep() {
		await this.page.getByTestId('login-signup-submit-btn').click();
	}

	async selectSecurityQuestion(questionKey: string) {
		await this.page.getByTestId('login-signup-security-question-select').selectOption(questionKey);
	}

	async fillSecurityAnswer(answer: string) {
		await this.page.getByTestId('login-signup-security-answer-input').fill(answer);
	}

	async submitSecurityStep() {
		await this.page.getByTestId('login-signup-security-submit-btn').click();
	}

	errorBox() {
		return this.page
			.getByTestId('login-signup-details-error')
			.or(this.page.getByTestId('login-signup-security-error'));
	}

	securityErrorBox() {
		return this.page.getByTestId('login-signup-security-error');
	}

	emailErrorBox() {
		return this.page.getByTestId('login-signup-email-error');
	}

	async gotoProfileCreation(): Promise<void> {
		const uniqueEmail = `test_${Date.now()}@example.test`;

		await this.goto();
		await this.clickSignUp();
		await this.fillEmail(uniqueEmail);
		await this.continue();
	}

	async fillProfileExcept(
		exclude:
			| 'fillFirstname'
			| 'fillLasttname'
			| 'fillweight'
			| 'fillheight'
			| 'fillbirthdate'
			| 'fillcalories'
			| 'fillprotein'
			| 'fillfat'
			| 'fillcarbs'
			| 'fillPassword'
			| 'selectSecurityQuestion'
			| 'fillSecurityAnswer'
	): Promise<void> {
		if (exclude !== 'fillFirstname') await this.fillFirstname('Max');
		if (exclude !== 'fillLasttname') await this.fillLasttname('Mustermann');
		if (exclude !== 'fillweight') await this.fillweight('80');
		if (exclude !== 'fillheight') await this.fillheight('180');
		if (exclude !== 'fillbirthdate') await this.fillbirthdate('2000-01-01');
		if (exclude !== 'fillcalories') await this.fillcalories('2200');
		if (exclude !== 'fillprotein') await this.fillprotein('140');
		if (exclude !== 'fillfat') await this.fillfat('70');
		if (exclude !== 'fillcarbs') await this.fillcarbs('250');
		if (exclude !== 'fillPassword') await this.fillPassword('DemoSecure123!');
	}
}
