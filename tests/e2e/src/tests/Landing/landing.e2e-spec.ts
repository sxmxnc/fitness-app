/**
 * Autor: Luca Lammers

 */
import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { Landing } from './landingPage';

describe('Landing Page Testing', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('landing page loads and shows hero section', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.hero().waitFor({ state: 'visible' });
  });

  it('login button navigates to login page', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.gotoLoginHero();
    await page.waitForURL(/\/login/);
  });

  it('explore button navigates to GitHub', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.gotoGitHero();
    await page.waitForURL('https://github.com/sxmxnc/fitness-app/users/sign_in');
  });

  it('features section is visible', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.features().waitFor({ state: 'visible' });
  });

  it('preview section is visible', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.preview().waitFor({ state: 'visible' });
  });

  it('footer section is visible', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.footer().waitFor({ state: 'visible' });
  });

  it('navbar start button navigates to login page', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.navStartBtn().click();
    await page.waitForURL(/\/login/);
  });

  it('features link scrolls features section into view', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.navFeaturesLink().click();
    await page.waitForTimeout(500);
    const isInView = await landing.features().evaluate((el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    expect(isInView).to.be.true;
  });

  it('preview link scrolls preview section into view', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.navPreviewLink().click();
    await page.waitForTimeout(500);
    const isInView = await landing.preview().evaluate((el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    expect(isInView).to.be.true;
  });

  it('contact link scrolls footer section into view', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.navContactLink().click();
    await page.waitForTimeout(500);
    const isInView = await landing.footer().evaluate((el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    expect(isInView).to.be.true;
  });

  it('footer GitHub link points to the correct repository', async () => {
    const landing = new Landing(page);
    await landing.goto();
    expect(await landing.footerGitHubLink().getAttribute('href')).to.equal(
      'https://github.com/sxmxnc/fitness-app'
    );
    await landing.footerGitHubLink().click();
    await page.waitForURL('https://github.com/sxmxnc/fitness-app/users/sign_in');
  });

  it('footer login link navigates to login page', async () => {
    const landing = new Landing(page);
    await landing.goto();
    await landing.footerLoginLink().click();
    await page.waitForURL(/\/login/);
  });
});
