import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { SignUpPage } from './signUpPage';

async function mockSignupError(page: Page, status: number, detail: string): Promise<void> {
	await page.evaluate(
		({ detail, status }) => {
			const originalFetch = window.fetch.bind(window);
			window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
				const rawUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
				const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
				const url = new URL(rawUrl, window.location.href);

				if (method === 'POST' && url.pathname === '/api/users') {
					return Promise.resolve(
						new Response(
							JSON.stringify({
								status,
								title: status === 409 ? 'Conflict' : 'Bad Request',
								detail
							}),
							{
								status,
								headers: { 'Content-Type': 'application/json' }
							}
						)
					);
				}

				return originalFetch(input, init);
			};
		},
		{ detail, status }
	);
}

function getFutureDate(offsetDays: number): string {
	const d = new Date();
	d.setDate(d.getDate() + offsetDays);
	return d.toISOString().split('T')[0];
}

function getTodayDate(): string {
	return new Date().toISOString().split('T')[0];
}

describe('Signup Testing', () => {
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

	it('user can sign up successfully', async () => {
		const signUpPage = new SignUpPage(page);
		const uniqueEmail = `test_${Date.now()}@example.test`;

		await signUpPage.goto();
		await signUpPage.clickSignUp();
		await signUpPage.fillEmail(uniqueEmail);
		await signUpPage.continue();

		await signUpPage.fillFirstname('Max');
		await signUpPage.fillLasttname('Mustermann');
		await signUpPage.fillPassword('DemoSecure123!');
		await signUpPage.fillweight('80');
		await signUpPage.fillheight('180');
		await signUpPage.fillbirthdate('2000-01-01');
		await signUpPage.fillcalories('2200');
		await signUpPage.fillprotein('140');
		await signUpPage.fillfat('70');
		await signUpPage.fillcarbs('250');
		await signUpPage.submitProfileStep();
		await signUpPage.selectSecurityQuestion('first_pet');
		await signUpPage.fillSecurityAnswer('Bello');
		await signUpPage.submit();
		await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });

		expect(page.url()).to.not.include('/login');
	});

	it('prevents signup when no security question was selected', async () => {
		const signUpPage = new SignUpPage(page);
		await signUpPage.gotoProfileCreation();
		await signUpPage.fillProfileExcept('selectSecurityQuestion');
		await signUpPage.submitProfileStep();
		await signUpPage.fillSecurityAnswer('Bello');
		await signUpPage.submitSecurityStep();

		const isInvalid = await page
			.getByTestId('login-signup-security-question-select')
			.evaluate((el: HTMLSelectElement) => !el.validity.valid);
		expect(isInvalid).to.be.true;
	});

	it('prevents signup when no security answer was entered', async () => {
		const signUpPage = new SignUpPage(page);
		await signUpPage.gotoProfileCreation();
		await signUpPage.fillProfileExcept('fillSecurityAnswer');
		await signUpPage.submitProfileStep();
		await signUpPage.selectSecurityQuestion('first_pet');
		await signUpPage.submitSecurityStep();

		const isInvalid = await page
			.getByTestId('login-signup-security-answer-input')
			.evaluate((el: HTMLInputElement) => !el.validity.valid);
		expect(isInvalid).to.be.true;
	});

	it('shows error on duplicate email', async () => {
		const signUpPage = new SignUpPage(page);

		await signUpPage.goto();
		await signUpPage.clickSignUp();
		await signUpPage.fillEmail('example1@example.test');
		await signUpPage.continue();

		await signUpPage.fillFirstname('Max');
		await signUpPage.fillLasttname('Mustermann');
		await signUpPage.fillPassword('DemoSecure123!');
		await signUpPage.fillweight('80');
		await signUpPage.fillheight('180');
		await signUpPage.fillbirthdate('2000-01-01');
		await signUpPage.fillcalories('2200');
		await signUpPage.fillprotein('140');
		await signUpPage.fillfat('70');
		await signUpPage.fillcarbs('250');

		await mockSignupError(page, 409, 'Email already in use');
		await signUpPage.submit();

		await signUpPage.securityErrorBox().waitFor({ state: 'visible' });
		expect(await signUpPage.securityErrorBox().textContent()).to.include('Diese E-Mail-Adresse ist bereits registriert.');
	});

	it('navigate back from register', async () => {
		const signUpPage = new SignUpPage(page);

		await signUpPage.goto();
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Willkommen');

		await signUpPage.clickSignUp();
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Registrieren');

		await signUpPage.clickBacklink();
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Willkommen');
	});

	it('navigate back from Profile creation', async () => {
		const signUpPage = new SignUpPage(page);
		const uniqueEmail = `test_${Date.now()}@example.test`;

		await signUpPage.goto();
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Willkommen');

		await signUpPage.clickSignUp();
		await signUpPage.fillEmail(uniqueEmail);
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Registrieren');

		await signUpPage.continue();
		await page.locator('h1.card-title:has-text("Fast geschafft!")').waitFor({ state: 'visible', timeout: 10000 });
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Fast geschafft!');

		await signUpPage.clickBacklink();
		expect((await signUpPage.getCardTitle().textContent())?.trim()).to.include('Registrieren');
	});

	describe('Input validation testing', () => {
		it('too short Password', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillPassword');
			await signUpPage.fillPassword('test');
			await mockSignupError(page, 400, 'Das Passwort ist zu kurz.');
			await signUpPage.submit();
			await signUpPage.errorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.errorBox().textContent()).to.include('Das Passwort ist zu kurz.');
		});

		it('Missing number', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillPassword');
			await signUpPage.fillPassword('testTest');
			await mockSignupError(page, 400, 'Das Passwort erfüllt die Passwortrichtlinie nicht.');
			await signUpPage.submit();
			await signUpPage.errorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.errorBox().textContent()).to.include(
				'Das Passwort erfüllt die Passwortrichtlinie nicht.'
			);
		});

		it('Missing Capital Letter', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillPassword');
			await signUpPage.fillPassword('testtest');
			await mockSignupError(page, 400, 'Das Passwort erfüllt die Passwortrichtlinie nicht.');
			await signUpPage.submit();
			await signUpPage.errorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.errorBox().textContent()).to.include(
				'Das Passwort erfüllt die Passwortrichtlinie nicht.'
			);
		});

		it('Missing Special Character', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillPassword');
			await signUpPage.fillPassword('testTest22AA');
			await mockSignupError(page, 400, 'Das Passwort erfüllt die Passwortrichtlinie nicht.');
			await signUpPage.submit();
			await signUpPage.errorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.errorBox().textContent()).to.include(
				'Das Passwort erfüllt die Passwortrichtlinie nicht.'
			);
		});
	});

	describe('Numeric range validation', () => {
		describe('too small (0)', () => {
			it('weight too small', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillweight');
				await signUpPage.fillweight('0');
				await mockSignupError(page, 400, 'weight: Too small: expected number to be >=1');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Gewicht (kg): Muss mindestens 1 sein');
			});

			it('height too small', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillheight');
				await signUpPage.fillheight('0');
				await mockSignupError(page, 400, 'height: Too small: expected number to be >=1');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Größe (cm): Muss mindestens 1 sein');
			});

			it('daily calorie goal too small', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillcalories');
				await signUpPage.fillcalories('0');
				await mockSignupError(page, 400, 'dailyCalorieGoal: Too small: expected number to be >=1');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Kalorien-Ziel: Muss mindestens 1 sein');
			});

			it('daily protein goal too small', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillprotein');
				await signUpPage.fillprotein('0');
				await mockSignupError(page, 400, 'dailyProteinGoal: Too small: expected number to be >=1');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Protein-Ziel: Muss mindestens 1 sein');
			});

			it('daily fat goal too small', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillfat');
				await signUpPage.fillfat('0');
				await mockSignupError(page, 400, 'dailyFatGoal: Too small: expected number to be >=1');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Fett-Ziel: Muss mindestens 1 sein');
			});

			it('daily carbs goal too small', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillcarbs');
				await signUpPage.fillcarbs('0');
				await mockSignupError(page, 400, 'dailyCarbsGoal: Too small: expected number to be >=1');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include(
					'Kohlenhydrat-Ziel: Muss mindestens 1 sein'
				);
			});
		});

		describe('too big', () => {
			it('weight too big', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillweight');
				await signUpPage.fillweight('201');
				await mockSignupError(page, 400, 'weight: Too big: expected number to be <=200');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Gewicht (kg): Darf maximal 200 sein');
			});

			it('height too big', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillheight');
				await signUpPage.fillheight('301');
				await mockSignupError(page, 400, 'height: Too big: expected number to be <=300');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Größe (cm): Darf maximal 300 sein');
			});

			it('daily calorie goal too big', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillcalories');
				await signUpPage.fillcalories('5001');
				await mockSignupError(page, 400, 'dailyCalorieGoal: Too big: expected number to be <=5000');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Kalorien-Ziel: Darf maximal 5000 sein');
			});

			it('daily protein goal too big', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillprotein');
				await signUpPage.fillprotein('401');
				await mockSignupError(page, 400, 'dailyProteinGoal: Too big: expected number to be <=400');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Protein-Ziel: Darf maximal 400 sein');
			});

			it('daily fat goal too big', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillfat');
				await signUpPage.fillfat('401');
				await mockSignupError(page, 400, 'dailyFatGoal: Too big: expected number to be <=400');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include('Fett-Ziel: Darf maximal 400 sein');
			});

			it('daily carbs goal too big', async () => {
				const signUpPage = new SignUpPage(page);
				await signUpPage.gotoProfileCreation();
				await signUpPage.fillProfileExcept('fillcarbs');
				await signUpPage.fillcarbs('401');
				await mockSignupError(page, 400, 'dailyCarbsGoal: Too big: expected number to be <=400');
				await signUpPage.submit();
				await signUpPage.errorBox().waitFor({ state: 'visible' });
				expect(await signUpPage.errorBox().textContent()).to.include(
					'Kohlenhydrat-Ziel: Darf maximal 400 sein'
				);
			});
		});
	});

	describe('Required field validation', () => {
		it('first name is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillFirstname');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-firstname-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('last name is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillLasttname');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-lastname-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('password is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillPassword');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-password-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('weight is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillweight');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-weight-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('height is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillheight');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-height-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('birthdate is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillbirthdate');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-birthdate-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily calorie goal is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillcalories');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-calorie-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily protein goal is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillprotein');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-protein-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily fat goal is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillfat');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-fat-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily carbs goal is required', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillcarbs');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-carbs-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('weight false input', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillweight');
			await signUpPage.fillweight('e');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-weight-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('height false input', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillheight');
			await signUpPage.fillheight('e');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-height-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily calorie false input', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillcalories');
			await signUpPage.fillcalories('e');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-calorie-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily protein false input', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillprotein');
			await signUpPage.fillprotein('e');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-protein-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily fat false input', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillfat');
			await signUpPage.fillfat('e');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-fat-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});

		it('daily carbs goal false input', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillcarbs');
			await signUpPage.fillcarbs('e');
			await signUpPage.submit();
			const isInvalid = await page
				.getByTestId('login-signup-carbs-input')
				.evaluate((el: HTMLInputElement) => !el.validity.valid);
			expect(isInvalid).to.be.true;
		});
	});

	describe('Email validation', () => {
		it('shows error on invalid email format', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.clickSignUp();
			await signUpPage.fillEmail('not-an-email');
			await signUpPage.continue();
			await signUpPage.emailErrorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.emailErrorBox().textContent()).to.include(
				'Bitte gib eine gültige E-Mail-Adresse ein.'
			);
		});

		it('shows error on email missing domain', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.clickSignUp();
			await signUpPage.fillEmail('user@');
			await signUpPage.continue();
			await signUpPage.emailErrorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.emailErrorBox().textContent()).to.include(
				'Bitte gib eine gültige E-Mail-Adresse ein.'
			);
		});

		it('shows error on email missing @', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.goto();
			await signUpPage.clickSignUp();
			await signUpPage.fillEmail('userexample.de');
			await signUpPage.continue();
			await signUpPage.emailErrorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.emailErrorBox().textContent()).to.include(
				'Bitte gib eine gültige E-Mail-Adresse ein.'
			);
		});
	});

	describe('Birthdate validation', () => {
		it('shows error when birthdate is in the future', async () => {
			const signUpPage = new SignUpPage(page);
			await signUpPage.gotoProfileCreation();
			await signUpPage.fillProfileExcept('fillbirthdate');
			await signUpPage.fillbirthdate(getFutureDate(1));
			await mockSignupError(page, 400, 'birthDate: birthDate cannot be in the future');
			await signUpPage.submit();
			await signUpPage.errorBox().waitFor({ state: 'visible' });
			expect(await signUpPage.errorBox().textContent()).to.include('Geburtsdatum');
		});
	});
});
