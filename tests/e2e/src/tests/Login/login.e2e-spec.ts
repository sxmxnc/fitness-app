/**
 * Autor: Luca Lammers

 */
import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { loginAsUser, loginAsAdmin } from '../../Common/login';
import { LoginPage } from './loginPage';

describe('Login Testing', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('user can log in successfully', async () => {
    await loginAsUser(page);
    expect(page.url()).to.not.include('/login');
  });

  it('admin can log in successfully', async () => {
    await loginAsAdmin(page);
    await page.waitForURL(/\/admin\/overview/);
  });

  it('shows error on wrong password', async () => {
    const loginPage = new LoginPage(page);
    await loginPage.login('example2@example.test', 'WrongPassword!');
    await loginPage.errorBox().waitFor({ state: 'visible' });
    expect(await loginPage.errorBox().textContent()).to.include('E-Mail-Adresse oder Passwort ist nicht korrekt.');
  });

  it('shows error on wrong password (admin)', async () => {
    const loginPage = new LoginPage(page);
    await loginPage.login('example1@example.test', 'WrongPassword!');
    await loginPage.errorBox().waitFor({ state: 'visible' });
    expect(await loginPage.errorBox().textContent()).to.include('E-Mail-Adresse oder Passwort ist nicht korrekt.');
  });

  it('shows error on invalid email format at sign-in step', async () => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickSignIn();
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('DemoSecure123!');
    await loginPage.submit();
    const isInvalid = await page
      .getByTestId('login-signin-email-input')
      .evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).to.be.true;
  });

  it('Submit button is disabled on empty fields', async () => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickSignIn();
    expect(await loginPage.submitButton.isDisabled()).to.be.true;
  });
});
