import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { SessionTimeoutPage, WARNING_THRESHOLD, TIMEOUT_MS } from './SessionTimeoutPage';
import { loginAsAdmin } from '../../Common/login';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

describe('Session Timeout', () => {
  describe('Warning Dialog', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    beforeEach(async () => {
      context = await browser.newContext({ ignoreHTTPSErrors: true });
      page = await context.newPage();
      await page.clock.install();
      const sp = new SessionTimeoutPage(page);
      await sp.gotoAsUser();
    });
    afterEach(async () => { await context.close(); });

    it('dialog appears after 9 min 50 sec of inactivity', async () => {
      const sp = new SessionTimeoutPage(page);
      await page.clock.fastForward(WARNING_THRESHOLD);
      await sp.overlay().waitFor({ state: 'visible' });
    });

    it('countdown starts at 10', async () => {
      const sp = new SessionTimeoutPage(page);
      await page.clock.fastForward(WARNING_THRESHOLD);
      expect((await sp.countdown().textContent())?.trim()).to.equal('10');
    });

    it('countdown decrements each second', async () => {
      const sp = new SessionTimeoutPage(page);
      await page.clock.fastForward(WARNING_THRESHOLD + 5000);
      const text = await sp.countdown().textContent();
      const value = Number(text?.trim());
      expect(value).to.be.at.least(1);
      expect(value).to.be.at.most(10);
    });

    it('Stay Logged In button dismisses the dialog', async () => {
      const sp = new SessionTimeoutPage(page);
      await page.clock.fastForward(WARNING_THRESHOLD);
      await sp.overlay().waitFor({ state: 'visible' });
      await sp.clickStayLoggedIn();
      await sp.overlay().waitFor({ state: 'hidden' });
      await page.waitForURL(`${BASE_URL}/profile`);
    });

    it('Stay Logged In button resets the full 10 min timer', async () => {
      const sp = new SessionTimeoutPage(page);
      await page.clock.fastForward(WARNING_THRESHOLD);
      await sp.clickStayLoggedIn();
      await page.clock.fastForward(WARNING_THRESHOLD - 1000);
      await sp.overlay().waitFor({ state: 'hidden' });
    });
  });

  describe('Auto-logout', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    beforeEach(async () => {
      context = await browser.newContext({ ignoreHTTPSErrors: true });
      page = await context.newPage();
      await page.clock.install();
      const sp = new SessionTimeoutPage(page);
      await sp.gotoAsUser();
    });
    afterEach(async () => { await context.close(); });

    it('redirects to landing page after 10 min of inactivity and removes Token', async () => {
      await page.clock.fastForward(TIMEOUT_MS);
      await page.waitForURL(`${BASE_URL}/`);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).to.be.null;
    });
  });

  describe('Excluded routes - no timeout', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
    afterEach(async () => { await context.close(); });

    it('does not show dialog on the landing page', async () => {
      await page.clock.install();
      await page.goto(`${BASE_URL}/`);
      await page.clock.fastForward(TIMEOUT_MS);
      await page.waitForURL(`${BASE_URL}/`);
      await page.getByTestId('session-timeout-overlay').waitFor({ state: 'hidden' });
    });

    it('dont show dialog on admin pages', async () => {
      await page.clock.install();
      await loginAsAdmin(page);
      await page.clock.fastForward(TIMEOUT_MS);
      await page.getByTestId('session-timeout-overlay').waitFor({ state: 'hidden' });
    });

    it('dont log out admin users due to inactivity', async () => {
      await page.clock.install();
      await loginAsAdmin(page);
      const urlBefore = page.url();
      await page.clock.fastForward(TIMEOUT_MS);
      await page.waitForURL(urlBefore);
    });
  });

  describe('Activity reset', () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    before(async () => { browser = await getBrowser(); });
    beforeEach(async () => {
      context = await browser.newContext({ ignoreHTTPSErrors: true });
      page = await context.newPage();
      await page.clock.install();
      const sp = new SessionTimeoutPage(page);
      await sp.gotoAsUser();
    });
    afterEach(async () => { await context.close(); });

    it('mouse movement prevents warning from appearing', async () => {
      const sp = new SessionTimeoutPage(page);
      await page.clock.fastForward(WARNING_THRESHOLD - 2000);
      await page.mouse.move(200, 200);
      await page.clock.fastForward(3000);
      await sp.overlay().waitFor({ state: 'hidden' });
    });
  });
});
