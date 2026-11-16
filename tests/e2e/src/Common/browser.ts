import { Browser, chromium } from 'playwright';

let sharedBrowser: Browser | undefined;

export async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch();
  }

  return sharedBrowser;
}

export async function closeBrowser(): Promise<void> {
  if (!sharedBrowser) {
    return;
  }

  const browser = sharedBrowser;
  sharedBrowser = undefined;
  await browser.close();
}

export const mochaHooks = {
  afterAll: async () => {
    await closeBrowser();
  },
};
