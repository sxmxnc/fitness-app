import { Browser, BrowserContext, Page } from 'playwright';
import { getBrowser } from '../../Common/browser';
import { expect } from 'chai';
import { AdminUserOverviewPage } from './AdminUserOverviewPage';
import { loginAsAdmin } from '../../Common/login';

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
  birthDate: '1995-06-15',
  dailyCalorieGoal: 2000,
  dailyProteinGoal: 120,
  dailyFatGoal: 60,
  dailyCarbsGoal: 250
};

const MOCK_SESSIONS = [
  { id: 's-1', userId: 'user-1', startedAt: 1700000000000, finishedAt: 1700003600000, isFinished: true },
  { id: 's-2', userId: 'user-1', startedAt: 1700086400000, finishedAt: 1700090000000, isFinished: true }
];

async function mockUsersApi(page: Page): Promise<void> {
  await page.route('**/admin/stats/users', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USERS)
    })
  );
}

async function mockAllApis(page: Page): Promise<void> {
  await mockUsersApi(page);
  await page.route('**/users/data/user-1', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER_STATS)
    })
  );
  await page.route('**/admin/session/user-1', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSIONS)
    })
  );
  await page.route('**/admin/stats/users/user-2/reactivate', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
  await page.route('**/users/user-1', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
}

describe('Rendering', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await mockAllApis(page);
    await loginAsAdmin(page);
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
  });
  afterEach(async () => { await context.close(); });

  it('user list is visible', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.userList().waitFor({ state: 'visible' });
  });

  it('sort pills are visible', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.sortPills().waitFor({ state: 'visible' });
  });

  it('all four sort buttons are visible', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.filterNewest().waitFor({ state: 'visible' });
    await overview.filterOldest().waitFor({ state: 'visible' });
    await overview.filteractive().waitFor({ state: 'visible' });
    await overview.filterInactive().waitFor({ state: 'visible' });
  });

  it('correct number of user rows is rendered', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.allUserRows().first().waitFor({ state: 'visible' });
    expect(await overview.allUserRows().count()).to.equal(2);
  });

  it('loading indicator is not visible after load', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.loadingIndicator().waitFor({ state: 'detached' });
  });

  it('error message is not visible on successful load', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.errorMessage().waitFor({ state: 'detached' });
  });

  it('empty state is not visible when users exist', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.emptyState().waitFor({ state: 'detached' });
  });
});

describe('User Row Content', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let overview: AdminUserOverviewPage;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await mockAllApis(page);
    await loginAsAdmin(page);
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
    overview = new AdminUserOverviewPage(page);
  });
  afterEach(async () => { await context.close(); });

  it('first user name is displayed', async () => {
    const name = await overview.getFirstResultName();
    expect(name).to.include('Anna');
  });

  it('first user status badge shows Aktiv', async () => {
    expect(await overview.getfirstUserStatus().textContent()).to.include('Aktiv');
  });

  it('stats button is visible on first user row', async () => {
    await overview.firstUserStatsButton().waitFor({ state: 'visible' });
  });

  it('toggle button is visible on first user row', async () => {
    await overview.firstUsertoggleButton().waitFor({ state: 'visible' });
  });

  it('toggle button for active user shows Deaktivieren', async () => {
    expect(await overview.firstUsertoggleButton().textContent()).to.include('Deaktivieren');
  });
});

describe('Search', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let overview: AdminUserOverviewPage;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await mockAllApis(page);
    await loginAsAdmin(page);
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
    overview = new AdminUserOverviewPage(page);
  });
  afterEach(async () => { await context.close(); });

  it('searching by first name filters the list', async () => {
    await overview.searchForName('Anna');
    const deadline = Date.now() + 5000;
    let count = await overview.allUserRows().count();
    while (count !== 1 && Date.now() < deadline) {
      await page.waitForTimeout(150);
      count = await overview.allUserRows().count();
    }
    expect(count).to.equal(1);
    const name = await overview.getFirstResultName();
    expect(name).to.include('Anna');
  });

  it('searching by last name filters the list', async () => {
    await overview.searchForName('Schmidt');
    const deadline = Date.now() + 5000;
    let count = await overview.allUserRows().count();
    while (count !== 1 && Date.now() < deadline) {
      await page.waitForTimeout(150);
      count = await overview.allUserRows().count();
    }
    expect(count).to.equal(1);
    const name = await overview.getFirstResultName();
    expect(name).to.include('Schmidt');
  });

  it('search with no match shows empty state', async () => {
    await overview.searchForName('ZZZnonexistent');
    await overview.emptyState().waitFor({ state: 'visible' });
    expect(await overview.allUserRows().count()).to.equal(0);
  });

  it('clearing search restores all users', async () => {
    await overview.searchForName('Anna');
    await overview.searchForName('');
    const deadline = Date.now() + 5000;
    let count = await overview.allUserRows().count();
    while (count !== 2 && Date.now() < deadline) {
      await page.waitForTimeout(150);
      count = await overview.allUserRows().count();
    }
    expect(count).to.equal(2);
  });

  it('search is case-insensitive', async () => {
    await overview.searchForName('anna');
    const deadline = Date.now() + 5000;
    let count = await overview.allUserRows().count();
    while (count !== 1 && Date.now() < deadline) {
      await page.waitForTimeout(150);
      count = await overview.allUserRows().count();
    }
    expect(count).to.equal(1);
  });
});

describe('Sort Filters', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let overview: AdminUserOverviewPage;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await mockAllApis(page);
    await loginAsAdmin(page);
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
    overview = new AdminUserOverviewPage(page);
  });
  afterEach(async () => { await context.close(); });

  it('active filter shows only active users', async () => {
    await overview.filteractive().click();
    const rows = overview.allUserRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      expect(await rows.nth(i).getByTestId('profiles-user-status-badge').textContent()).to.include('Aktiv');
    }
  });

  it('inactive filter shows only inactive users', async () => {
    await overview.filterInactive().click();
    const rows = overview.allUserRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      expect(await rows.nth(i).getByTestId('profiles-user-status-badge').textContent()).to.include('Inaktiv');
    }
  });

  it('newest filter shows all users', async () => {
    await overview.filterNewest().click();
    await overview.allUserRows().first().waitFor({ state: 'visible' });
    expect(await overview.allUserRows().count()).to.equal(2);
  });

  it('oldest filter shows all users', async () => {
    await overview.filterOldest().click();
    await overview.allUserRows().first().waitFor({ state: 'visible' });
    expect(await overview.allUserRows().count()).to.equal(2);
  });

  it('oldest filter puts earlier-created user last', async () => {
    await overview.filterNewest().click();
    const newestFirst = await overview.getFirstResultName();
    await overview.filterOldest().click();
    const oldestFirst = await overview.getFirstResultName();
    expect(newestFirst).to.not.equal(oldestFirst);
  });
});

describe('Toggle User Status', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await mockAllApis(page);
    await loginAsAdmin(page);
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
  });
  afterEach(async () => { await context.close(); });

  it('deactivating active user flips badge to Inaktiv', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.firstUsertoggleButton().click();
    await overview.getfirstUserStatus().filter({ hasText: 'Inaktiv' }).waitFor({ timeout: 5000 });
    expect(await overview.getfirstUserStatus().textContent()).to.include('Inaktiv');
  });


  it('inactive user toggle button shows Aktivieren', async () => {
    const overview = new AdminUserOverviewPage(page);
    await overview.filterInactive().click();
    expect(await overview.firstUsertoggleButton().textContent()).to.include('Aktivieren');
  });
});

describe('Error State', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('shows error message when API fails', async () => {
    await page.route('**/admin/stats/users', route => route.fulfill({ status: 500, body: 'Internal Server Error' }));
    await loginAsAdmin(page);
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(/\/admin\/profiles/);
    const overview = new AdminUserOverviewPage(page);
    await overview.errorMessage().waitFor({ state: 'visible' });
    expect(await overview.errorMessage().textContent()).to.include('Fehler beim Laden der Benutzer');
  });
});

describe('Access Control', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  before(async () => { browser = await getBrowser(); });
  beforeEach(async () => { context = await browser.newContext({ ignoreHTTPSErrors: true }); page = await context.newPage(); });
  afterEach(async () => { await context.close(); });

  it('unauthenticated user is redirected to login', async () => {
    await page.goto(`${process.env.BASE_URL ?? 'http://localhost:8080'}/admin/profiles`);
    await page.waitForURL(url => !url.pathname.includes('/admin/profiles'), { timeout: 10_000 });
    expect(page.url()).to.include('/login');
  });
});
