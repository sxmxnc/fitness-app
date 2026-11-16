import crypto from 'node:crypto';
import { Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';
// API_URL may be provided as an origin ("https://docker:3000") or already include the
// "/api" prefix. Normalize so the prefix is always present exactly once.
const API_ORIGIN = (process.env.API_URL ?? (BASE_URL.startsWith('https:') ? 'https://localhost:3000' : 'http://localhost:3000'))
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');
const API_URL = `${API_ORIGIN}/api`;
const LOGIN_TIMEOUT_MS = 15000;
const TEST_PASSWORD = 'DemoSecure123!';
const runId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const USERS = {
  user1: { email: `admin_${runId}@example.test`, password: TEST_PASSWORD },
  user2: { email: `user_${runId}@example.test`, password: TEST_PASSWORD },
} as const;

let setupPromise: Promise<{ adminId: string; userId: string }> | null = null;

async function ensureTestUsers(page: Page): Promise<{ adminId: string; userId: string }> {
  setupPromise ??= Promise.all([createUser(page, USERS.user1.email), createUser(page, USERS.user2.email)]).then(
    ([adminId, userId]) => ({ adminId, userId })
  );
  return setupPromise;
}

async function createUser(page: Page, email: string): Promise<string> {
  const response = await page.request.post(`${API_URL}/users`, {
    data: {
      email,
      firstName: 'E2E',
      lastName: 'User',
      password: TEST_PASSWORD,
      weight: 80,
      height: 180,
      birthDate: new Date('2000-01-01').getTime(),
      dailyCalorieGoal: 2200,
      dailyProteinGoal: 140,
      dailyFatGoal: 70,
      dailyCarbsGoal: 250,
      securityQuestionKey: 'first_pet',
      securityAnswer: 'Bello'
    }
  });

  if (!response.ok()) {
    throw new Error(`Could not create E2E user ${email}: ${response.status()} ${await response.text()}`);
  }

  const json = await response.json();
  return json.id as string;
}

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await ensureTestUsers(page);
  page.setDefaultTimeout(LOGIN_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(LOGIN_TIMEOUT_MS);

  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('button.btn-secondary', { timeout: LOGIN_TIMEOUT_MS });

  await page.locator('button.btn-secondary').click();

  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(password);

  await page.locator('button.btn-primary').click();

  
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: LOGIN_TIMEOUT_MS });
}

export async function loginAsUser(page: Page): Promise<void> {
  await loginAs(page, USERS.user2.email, USERS.user2.password);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const { adminId } = await ensureTestUsers(page);
  const token = signJwt({ id: adminId, email: USERS.user1.email, role: 'admin' });

  await page.goto(BASE_URL);
  await page.evaluate(
    ({ adminId, token }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', adminId);
    },
    { adminId, token }
  );
  await page.goto(`${BASE_URL}/admin/overview`);
  await page.waitForURL(url => url.pathname === '/admin/overview', { timeout: LOGIN_TIMEOUT_MS });
}

function signJwt(payload: { id: string; email: string; role: 'admin' }): string {
  const secret = process.env.JWT_SECRET ?? 'change-this-to-a-long-random-secret';
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 2 * 60 * 60 };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}
