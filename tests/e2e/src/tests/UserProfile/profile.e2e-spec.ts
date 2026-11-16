/**
 * Autor: Luca Lammers

 */
import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { ProfilePage } from './ProfilePage';
import { loginAs, loginAsUser, USERS } from '../../Common/login';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

describe('Profile Page', () => {

  describe('Page Load', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
    afterEach(async () => { await context.close(); });

    it('shows all cards and username after login', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.UserName().waitFor({ state: 'visible' });
      await profilePage.GoalsCard().waitFor({ state: 'visible' });
      await profilePage.PersonelInfoCard().waitFor({ state: 'visible' });
      await profilePage.PasswordCard().waitFor({ state: 'visible' });
    });

    it('all inputs are disabled in view mode', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      expect(await profilePage.age().isDisabled()).to.be.true;
      expect(await profilePage.weight().isDisabled()).to.be.true;
      expect(await profilePage.height().isDisabled()).to.be.true;
      expect(await profilePage.firstName().isDisabled()).to.be.true;
      expect(await profilePage.currentPassword().isDisabled()).to.be.true;
    });

    it('accessing profile without token redirects to home', async () => {
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForURL(url => !url.pathname.includes('/profile'), { timeout: 10000 });
      expect(page.url()).to.not.include('/profile');
    });

    it('all three cards can be opened simultaneously and stay Open', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.changeStateDailyGoals();
      await profilePage.changeStatePersonalInfo();
      await profilePage.changeStateChangePassword();
      await profilePage.changeStateDailyGoals();
      await profilePage.changeStatePersonalInfo();
      await profilePage.changeStateChangePassword();
      await profilePage.weight().waitFor({ state: 'visible' });
      await profilePage.firstName().waitFor({ state: 'visible' });
      await profilePage.currentPassword().waitFor({ state: 'visible' });
    });
  });

  describe('Daily Goals', () => {
    describe('Toggle', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('collapses and expands the card', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.weight().waitFor({ state: 'visible' });
        await profilePage.changeStateDailyGoals();
        await profilePage.weight().waitFor({ state: 'hidden' });
        await profilePage.changeStateDailyGoals();
        await profilePage.weight().waitFor({ state: 'visible' });
      });

      it('collapsing while editing reverts unsaved changes', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        const original = await profilePage.weight().inputValue();
        await profilePage.editDailyGoals();
        await profilePage.weight().fill(String(Number(original) + 10));
        await profilePage.changeStateDailyGoals();
        await profilePage.changeStateDailyGoals();
        expect(await profilePage.weight().inputValue()).to.equal(original);
        expect(await profilePage.weight().isDisabled()).to.be.true;
      });
    });

    describe('Edit / Cancel', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('edit mode enables inputs', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        expect(await profilePage.age().isEnabled()).to.be.true;
        expect(await profilePage.weight().isEnabled()).to.be.true;
        expect(await profilePage.height().isEnabled()).to.be.true;
        expect(await profilePage.calorieGoal().isEnabled()).to.be.true;
        expect(await profilePage.proteinGoal().isEnabled()).to.be.true;
        expect(await profilePage.carbGoal().isEnabled()).to.be.true;
        expect(await profilePage.fatGoal().isEnabled()).to.be.true;
      });

      it('save button only visible in edit mode', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await page.getByTestId('profile-goals-save-btn').waitFor({ state: 'hidden' });
        await profilePage.editDailyGoals();
        await page.getByTestId('profile-goals-save-btn').waitFor({ state: 'visible' });
      });

      it('cancel reverts unsaved changes and disables inputs', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        const original = await profilePage.weight().inputValue();
        await profilePage.editDailyGoals();
        await profilePage.weight().fill(String(Number(original) + 50));
        await profilePage.editDailyGoals(); // cancel
        expect(await profilePage.weight().inputValue()).to.equal(original);
        expect(await profilePage.weight().isDisabled()).to.be.true;
      });
    });

    describe('Valid Save', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('saves successfully and shows success message', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        const original = await profilePage.weight().inputValue();
        await profilePage.editDailyGoals();
        await profilePage.weight().fill(String(Number(original) + 1));
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Erfolgreich gespeichert.');
        expect(await profilePage.weight().isDisabled()).to.be.true;
      });
    });

    describe('Validation errors', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('age = 0 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.age().fill('0');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Alter muss zwischen 1 und 120 liegen.');
      });

      it('age = 121 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.age().fill('121');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Alter muss zwischen 1 und 120 liegen.');
      });

      it('weight = 0 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.weight().fill('0');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Gewicht muss größer als 0 sein.');
      });

      it('height = 0 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.height().fill('0');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Die Größe muss größer als 0 sein.');
      });

      it('calorie goal = -1 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.calorieGoal().fill('-1');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Kalorienziel darf nicht negativ sein.');
      });

      it('protein goal = -1 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.proteinGoal().fill('-1');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Proteinziel darf nicht negativ sein.');
      });

      it('carbs goal = -1 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.carbGoal().fill('-1');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Kohlenhydratziel darf nicht negativ sein.');
      });

      it('fat goal = -1 shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editDailyGoals();
        await profilePage.fatGoal().fill('-1');
        await profilePage.saveDailyGoals();
        expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Das Fettziel darf nicht negativ sein.');
      });
    });
  });

  describe('Personal Info', () => {
    describe('Toggle', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('collapses and expands the card', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.firstName().waitFor({ state: 'visible' });
        await profilePage.changeStatePersonalInfo();
        await profilePage.firstName().waitFor({ state: 'hidden' });
        await profilePage.changeStatePersonalInfo();
        await profilePage.firstName().waitFor({ state: 'visible' });
      });

      it('collapsing while editing reverts unsaved changes', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        const original = await profilePage.firstName().inputValue();
        await profilePage.editPersonalInfo();
        await profilePage.firstName().fill('ChangedName');
        await profilePage.changeStatePersonalInfo();
        await profilePage.changeStatePersonalInfo();
        expect(await profilePage.firstName().inputValue()).to.equal(original);
        expect(await profilePage.firstName().isDisabled()).to.be.true;
      });
    });

    describe('Edit / Cancel', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('edit mode enables inputs', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editPersonalInfo();
        expect(await profilePage.firstName().isEnabled()).to.be.true;
        expect(await profilePage.lastName().isEnabled()).to.be.true;
        expect(await profilePage.email().isEnabled()).to.be.true;
      });

      it('save button only visible in edit mode', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await page.getByTestId('profile-info-save-btn').waitFor({ state: 'hidden' });
        await profilePage.editPersonalInfo();
        await page.getByTestId('profile-info-save-btn').waitFor({ state: 'visible' });
      });

      it('cancel reverts unsaved changes and disables inputs', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        const original = await profilePage.firstName().inputValue();
        await profilePage.editPersonalInfo();
        await profilePage.firstName().fill('TempName');
        await profilePage.editPersonalInfo(); // cancel
        expect(await profilePage.firstName().inputValue()).to.equal(original);
        expect(await profilePage.firstName().isDisabled()).to.be.true;
      });
    });

    describe('Valid Save', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('saves and shows success message', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        const original = await profilePage.firstName().inputValue();
        await profilePage.editPersonalInfo();
        await profilePage.firstName().fill(original + 'X');
        await profilePage.savePersonalInfo();
        expect(await profilePage.PersonalInfoSaveSuccsessMessage().textContent()).to.include('Erfolgreich gespeichert.');
        expect(await profilePage.firstName().isDisabled()).to.be.true;
      });
    });

    describe('Validation errors', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('shows error when changing email to an already existing email', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editPersonalInfo();
        await profilePage.email().fill(USERS.user1.email);
        await profilePage.savePersonalInfo();
        await profilePage.PersonalInfoSaveSuccsessMessage().waitFor({ state: 'visible' });
        expect(await profilePage.PersonalInfoSaveSuccsessMessage().textContent()).to.include('Änderungen konnten nicht gespeichert werden.');
      });

      it('shows validation error on invalid email format in personal info', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editPersonalInfo();
        await profilePage.email().fill('not-an-email');
        await profilePage.savePersonalInfo();
        const isInvalid = await page
          .getByTestId('profile-info-email-input')
          .evaluate((el: HTMLInputElement) => !el.validity.valid);
        expect(isInvalid).to.be.true;
      });
    });
  });

  describe('Change Password', () => {
    describe('Toggle', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('collapses and expands the card', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.currentPassword().waitFor({ state: 'visible' });
        await profilePage.changeStateChangePassword();
        await profilePage.currentPassword().waitFor({ state: 'hidden' });
        await profilePage.changeStateChangePassword();
        await profilePage.currentPassword().waitFor({ state: 'visible' });
      });

      it('collapsing while editing clears password fields', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill('SomePassword123!');
        await profilePage.changeStateChangePassword();
        await profilePage.changeStateChangePassword();
        expect(await profilePage.currentPassword().inputValue()).to.equal('');
        expect(await profilePage.currentPassword().isDisabled()).to.be.true;
      });
    });

    describe('Edit / Cancel', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('edit mode enables password inputs', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        expect(await profilePage.currentPassword().isEnabled()).to.be.true;
        expect(await profilePage.newPassword().isEnabled()).to.be.true;
        expect(await profilePage.newPasswordConfirm().isEnabled()).to.be.true;
      });

      it('save button only visible in edit mode', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await page.getByTestId('profile-password-save-btn').waitFor({ state: 'hidden' });
        await profilePage.editChangePassword();
        await page.getByTestId('profile-password-save-btn').waitFor({ state: 'visible' });
      });

      it('cancel clears password fields and disables inputs', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill('SomePassword123!');
        await profilePage.editChangePassword(); // cancel
        expect(await profilePage.currentPassword().inputValue()).to.equal('');
        expect(await profilePage.currentPassword().isDisabled()).to.be.true;
      });
    });

    describe('Validation errors', () => {
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('missing fields shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Bitte alle Felder ausfüllen.');
      });

      it('new passwords do not match', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(USERS.user2.password);
        await profilePage.newPassword().fill('NewSecurePass123!');
        await profilePage.newPasswordConfirm().fill('DifferentSecure123!');
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Die neuen Passwörter stimmen nicht überein.');
      });

      it('new password too short', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(USERS.user2.password);
        await profilePage.newPassword().fill('Sh0rt!');
        await profilePage.newPasswordConfirm().fill('Sh0rt!');
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Mind. 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.');
      });

      it('new password missing uppercase', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(USERS.user2.password);
        await profilePage.newPassword().fill('passwordsecure123!');
        await profilePage.newPasswordConfirm().fill('passwordsecure123!');
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Mind. 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.');
      });

      it('new password missing number', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(USERS.user2.password);
        await profilePage.newPassword().fill('PasswordNoDigit!');
        await profilePage.newPasswordConfirm().fill('PasswordNoDigit!');
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Mind. 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.');
      });

      it('new password missing special character', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(USERS.user2.password);
        await profilePage.newPassword().fill('PasswordSecure123');
        await profilePage.newPasswordConfirm().fill('PasswordSecure123');
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Mind. 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.');
      });

      it('wrong current password shows error', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill('WrongPassword123!');
        await profilePage.newPassword().fill('NewSecurePass456!');
        await profilePage.newPasswordConfirm().fill('NewSecurePass456!');
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Passwort konnte nicht geändert werden.');
      });
    });

    describe('Password change flow', () => {
      const NEW_PASSWORD = 'NewSecurePass456!';
      let browser: Browser;
      let context: BrowserContext;
      let page: Page;

      before(async () => { browser = await getBrowser(); });
      after(async function () {
        this.timeout(20000);
        // Guarantee the original password is restored even if a test fails mid-way.
        const cleanupCtx = await browser.newContext({ ignoreHTTPSErrors: true });
        const cleanupPage = await cleanupCtx.newPage();
        try {
          await cleanupPage.goto(`${BASE_URL}/login`);
          await cleanupPage.waitForSelector('button.btn-secondary', { timeout: 10000 });
          await cleanupPage.locator('button.btn-secondary').click();
          await cleanupPage.locator('#signin-email').fill(USERS.user2.email);
          await cleanupPage.locator('#signin-password').fill(NEW_PASSWORD);
          await cleanupPage.locator('button.btn-primary').click();
          await cleanupPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
          // Login succeeded — password is still NEW_PASSWORD, restore it.
          const profilePage = new ProfilePage(cleanupPage);
          await cleanupPage.goto(`${BASE_URL}/profile`);
          await profilePage.editChangePassword();
          await profilePage.currentPassword().fill(NEW_PASSWORD);
          await profilePage.newPassword().fill(USERS.user2.password);
          await profilePage.newPasswordConfirm().fill(USERS.user2.password);
          await profilePage.saveChangePassword();
        } catch {
          // waitForURL timed out = login failed = original password is already restored.
        } finally {
          cleanupCtx.close().catch(() => {});
        }
      });
      beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
      afterEach(async () => { await context.close(); });

      it('changes password successfully and logs out', async () => {
        const profilePage = new ProfilePage(page);
        await profilePage.goto();
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(USERS.user2.password);
        await profilePage.newPassword().fill(NEW_PASSWORD);
        await profilePage.newPasswordConfirm().fill(NEW_PASSWORD);
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Passwort erfolgreich geändert.');
        await profilePage.logout();
        await page.waitForURL(url => url.pathname === '/');
      });

      it('login with old password fails after password change', async () => {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForSelector('button.btn-secondary', { timeout: 5000 });
        await page.locator('button.btn-secondary').click();
        await page.locator('#signin-email').fill(USERS.user2.email);
        await page.locator('#signin-password').fill(USERS.user2.password);
        await page.locator('button.btn-primary').click();
        expect(await page.getByTestId('login-signin-error-msg').textContent()).to.include('E-Mail-Adresse oder Passwort ist nicht korrekt.');
      });

      it('login with new password succeeds', async () => {
        await loginAs(page, USERS.user2.email, NEW_PASSWORD);
        expect(page.url()).to.not.include('/login');
      });

      it('restores original password', async () => {
        await loginAs(page, USERS.user2.email, NEW_PASSWORD);
        const profilePage = new ProfilePage(page);
        await page.goto(`${BASE_URL}/profile`);
        await profilePage.editChangePassword();
        await profilePage.currentPassword().fill(NEW_PASSWORD);
        await profilePage.newPassword().fill(USERS.user2.password);
        await profilePage.newPasswordConfirm().fill(USERS.user2.password);
        await profilePage.saveChangePassword();
        expect(await profilePage.ChangePasswordSaveSuccsessMessage().textContent()).to.include('Passwort erfolgreich geändert.');
      });
    });
  });

  describe('Personal Info – data persists after logout/login', () => {
    let originalFirstName: string;
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    after(async () => {
      // Guarantee the original name is restored even if a test fails mid-way.
      if (!originalFirstName) { return; }
      const cleanupCtx = await browser.newContext({ ignoreHTTPSErrors: true });
      const cleanupPage = await cleanupCtx.newPage();
      try {
        await loginAsUser(cleanupPage);
        await cleanupPage.goto(`${BASE_URL}/profile`);
        const profilePage = new ProfilePage(cleanupPage);
        const current = await profilePage.firstName().inputValue();
        if (current !== originalFirstName) {
          await profilePage.editPersonalInfo();
          await profilePage.firstName().fill(originalFirstName);
          await profilePage.savePersonalInfo();
        }
      } finally {
        await cleanupCtx.close();
      }
    });
    beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
    afterEach(async () => { await context.close(); });

    it('saves changed first name, logs out, logs back in and sees new value', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      originalFirstName = await profilePage.firstName().inputValue();

      await profilePage.editPersonalInfo();
      await profilePage.firstName().fill('PersistTest');
      await profilePage.savePersonalInfo();
      expect(await profilePage.PersonalInfoSaveSuccsessMessage().textContent()).to.include('Erfolgreich gespeichert.');

      await profilePage.logout();
      await loginAs(page, USERS.user2.email, USERS.user2.password);
      await page.goto(`${BASE_URL}/profile`);

      expect(await profilePage.firstName().inputValue()).to.equal('PersistTest');
    });

    it('restores original first name', async () => {
      const profilePage = new ProfilePage(page);
      await loginAsUser(page);
      await page.goto(`${BASE_URL}/profile`);
      await profilePage.editPersonalInfo();
      await profilePage.firstName().fill(originalFirstName);
      await profilePage.savePersonalInfo();
      expect(await profilePage.PersonalInfoSaveSuccsessMessage().textContent()).to.include('Erfolgreich gespeichert.');
    });
  });

  describe('Daily Goals – data persists after logout/login', () => {
    let originalWeight: string;
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    after(async () => {
      // Guarantee the original weight is restored even if a test fails mid-way.
      if (!originalWeight) { return; }
      const cleanupCtx = await browser.newContext({ ignoreHTTPSErrors: true });
      const cleanupPage = await cleanupCtx.newPage();
      try {
        await loginAsUser(cleanupPage);
        await cleanupPage.goto(`${BASE_URL}/profile`);
        const profilePage = new ProfilePage(cleanupPage);
        const current = await profilePage.weight().inputValue();
        if (current !== originalWeight) {
          await profilePage.editDailyGoals();
          await profilePage.weight().fill(originalWeight);
          await profilePage.saveDailyGoals();
        }
      } finally {
        await cleanupCtx.close();
      }
    });
    beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
    afterEach(async () => { await context.close(); });

    it('saves changed weight, logs out, logs back in and sees new value', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      originalWeight = await profilePage.weight().inputValue();
      const newWeight = String(Number(originalWeight) + 5);

      await profilePage.editDailyGoals();
      await profilePage.weight().fill(newWeight);
      await profilePage.saveDailyGoals();
      expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Erfolgreich gespeichert.');

      await profilePage.logout();
      await loginAs(page, USERS.user2.email, USERS.user2.password);
      await page.goto(`${BASE_URL}/profile`);

      expect(await profilePage.weight().inputValue()).to.equal(newWeight);
    });

    it('restores original weight', async () => {
      const profilePage = new ProfilePage(page);
      await loginAsUser(page);
      await page.goto(`${BASE_URL}/profile`);
      await profilePage.editDailyGoals();
      await profilePage.weight().fill(originalWeight);
      await profilePage.saveDailyGoals();
      expect(await profilePage.DailyGoalsSaveSuccsessMessage().textContent()).to.include('Erfolgreich gespeichert.');
    });
  });

  describe('Logout', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
    afterEach(async () => { await context.close(); });

    it('redirects to home page after logout', async () => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.logout();
      await page.waitForURL(url => url.pathname === '/');
    });
  });
});
