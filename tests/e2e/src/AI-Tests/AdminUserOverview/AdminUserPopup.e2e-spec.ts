import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { AdminUserOverviewPage } from './AdminUserOverviewPage';
import { UserPopupPage } from './UserPopupPage';
import { loginAsAdmin } from '../../Common/login';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

const MOCK_USERS = [
  {
    id: 'user-1',
    firstName: 'Anna',
    lastName: 'Müller',
    email: 'anna@example.test',
    createdAt: 1700000000000,
    isDeactivated: false
  },
  {
    id: 'user-2',
    firstName: 'Ben',
    lastName: 'Schmidt',
    email: 'ben@example.test',
    createdAt: 1690000000000,
    isDeactivated: true
  }
];

const MOCK_USER_STATS = {
  id: 'user-1',
  firstName: 'Anna',
  lastName: 'Müller',
  email: 'anna@example.test',
  createdAt: 1700000000000,
  isDeactivated: false,
  weight: 65,
  height: 170,
  birthDate: 791510400000,
  dailyCalorieGoal: 2000,
  dailyProteinGoal: 120,
  dailyFatGoal: 60,
  dailyCarbsGoal: 250
};

const MOCK_SESSIONS = [
  { id: 's-1', userId: 'user-1', startedAt: 1700000000000, finishedAt: 1700003600000, isFinished: true },
  { id: 's-2', userId: 'user-1', startedAt: 1700086400000, finishedAt: 1700090000000, isFinished: true }
];

async function setupPage(page: Page, sessions: object[] = MOCK_SESSIONS, statsStatus = 200): Promise<void> {
  await page.route('**/admin/stats/users', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USERS)
    })
  );
  await page.route('**/users/data/user-1', route =>
    route.fulfill({
      status: statsStatus,
      contentType: 'application/json',
      body: statsStatus === 200 ? JSON.stringify(MOCK_USER_STATS) : 'error'
    })
  );
  await page.route('**/admin/session/user-1', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessions)
    })
  );
  await loginAsAdmin(page);
  await page.goto(`${BASE_URL}/admin/profiles`);
  await page.waitForURL(/\/admin\/profiles/);
}

describe('Popup: Opening', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('clicking stats button opens the popup', async () => {
    await setupPage(page);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
  });

  it('popup shows the correct user name', async () => {
    await setupPage(page);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupLoading().waitFor({ state: 'detached' });
    expect(await popup.popupName().textContent()).to.include('Anna Müller');
  });

  it('popup shows the correct email', async () => {
    await setupPage(page);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupLoading().waitFor({ state: 'detached' });
    expect(await popup.popupEmail().textContent()).to.include('anna@example.test');
  });

  it('popup overlay is visible when popup is open', async () => {
    await setupPage(page);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popupOverlay().waitFor({ state: 'visible' });
  });
});

describe('Popup: Data Tab', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let overview: AdminUserOverviewPage;
  let popup: UserPopupPage;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await setupPage(page);
    overview = new AdminUserOverviewPage(page);
    popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
  });
  afterEach(async () => { await context.close(); });

  it('data tab is active by default', async () => {
    await popup.popupDataGrid().waitFor({ state: 'visible' });
  });

  it('data tab button is visible', async () => {
    await popup.popupTabData().waitFor({ state: 'visible' });
  });

  it('overview tab button is visible', async () => {
    await popup.popupTabOverview().waitFor({ state: 'visible' });
  });

  it('registered date stat is visible', async () => {
    await popup.popupStatRegistered().waitFor({ state: 'visible' });
  });

  it('status stat shows Aktiv for active user', async () => {
    expect(await popup.popupStatStatus().textContent()).to.include('Aktiv');
  });

  it('weight stat shows correct value', async () => {
    expect(await popup.popupStatWeight().textContent()).to.include('65 kg');
  });

  it('height stat shows correct value', async () => {
    expect(await popup.popupStatHeight().textContent()).to.include('170 cm');
  });

  it('calorie goal stat shows correct value', async () => {
    expect(await popup.popupStatCalorie().textContent()).to.include('2000 kcal');
  });

  it('protein goal stat shows correct value', async () => {
    expect(await popup.popupStatProtein().textContent()).to.include('120 g');
  });

  it('fat goal stat shows correct value', async () => {
    expect(await popup.popupStatFat().textContent()).to.include('60 g');
  });

  it('carbs goal stat shows correct value', async () => {
    expect(await popup.popupStatCarbs().textContent()).to.include('250 g');
  });
});

describe('Popup: Data Tab with missing fields', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('null stats fields render as —', async () => {
    await page.route('**/admin/stats/users', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USERS)
      })
    );
    await page.route('**/users/data/user-1', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_USER_STATS,
          weight: null,
          height: null,
          dailyCalorieGoal: null,
          dailyProteinGoal: null,
          dailyFatGoal: null,
          dailyCarbsGoal: null
        })
      })
    );
    await page.route('**/admin/session/user-1', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSIONS)
      })
    );
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    expect(await popup.popupStatWeight().textContent()).to.include('—');
    expect(await popup.popupStatHeight().textContent()).to.include('—');
    expect(await popup.popupStatCalorie().textContent()).to.include('—');
  });
});

describe('Popup: Overview Tab with sessions', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let overview: AdminUserOverviewPage;
  let popup: UserPopupPage;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await setupPage(page);
    overview = new AdminUserOverviewPage(page);
    popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupTabOverview().click();
  });
  afterEach(async () => { await context.close(); });

  it('overview content is visible after tab switch', async () => {
    await popup.popupOverviewContent().waitFor({ state: 'visible' });
  });

  it('data grid is hidden after switching to overview tab', async () => {
    await popup.popupDataGrid().waitFor({ state: 'detached' });
  });

  it('average session duration stat is visible', async () => {
    await popup.popupStatAvgDuration().waitFor({ state: 'visible' });
  });

  it('longest streak stat is visible', async () => {
    await popup.popupStatStreak().waitFor({ state: 'visible' });
  });

  it('switching back to data tab shows data grid', async () => {
    await popup.popupTabData().click();
    await popup.popupDataGrid().waitFor({ state: 'visible' });
  });
});

describe('Popup: Overview Tab without sessions', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('empty state is shown when user has no sessions', async () => {
    await setupPage(page, []);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupTabOverview().click();
    await popup.popupEmptyState().waitFor({ state: 'visible' });
    await popup.popupOverviewContent().waitFor({ state: 'detached' });
  });
});

describe('Popup: Closing', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('close button dismisses the popup', async () => {
    await setupPage(page);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupCloseBtn().click();
    await popup.popup().waitFor({ state: 'detached' });
  });

  it('clicking the overlay dismisses the popup', async () => {
    await setupPage(page);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupOverlay().click({ position: { x: 5, y: 5 } });
    await popup.popup().waitFor({ state: 'detached' });
  });

  it('popup is not present before stats button is clicked', async () => {
    await setupPage(page);
    const popup = new UserPopupPage(page);
    await popup.popup().waitFor({ state: 'detached' });
  });
});

describe('Popup: Stats API fallback', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('popup still opens when stats API returns error', async () => {
    await setupPage(page, MOCK_SESSIONS, 500);
    const overview = new AdminUserOverviewPage(page);
    const popup = new UserPopupPage(page);
    await overview.firstUserStatsButton().click();
    await popup.popup().waitFor({ state: 'visible' });
    await popup.popupLoading().waitFor({ state: 'detached' });
    expect(await popup.popupName().textContent()).to.include('Anna Müller');
  });
});
