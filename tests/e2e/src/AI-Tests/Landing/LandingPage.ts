import { Locator, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class LandingPage {
	constructor(private page: Page) {}

	homeElement(): Locator {
		return this.page.locator('app-home');
	}

	hero(): Locator {
		return this.homeElement().getByTestId('hero-section');
	}

	heroStartButton(): Locator {
		return this.homeElement().getByTestId('hero-start-btn');
	}

	heroProjectButton(): Locator {
		return this.homeElement().getByTestId('hero-project-btn');
	}

	features(): Locator {
		return this.homeElement().locator('#features');
	}

	preview(): Locator {
		return this.homeElement().locator('#preview');
	}

	footer(): Locator {
		return this.homeElement().locator('landing-footer');
	}

	navStartButton(): Locator {
		return this.homeElement().locator('a[href="/login"]').first();
	}

	async goto() {
		await this.page.goto(BASE_URL);
		await this.hero().waitFor({ state: 'visible' });
	}
}
