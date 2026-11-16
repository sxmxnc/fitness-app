import { Locator, Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

export class DashboardPage {
	constructor(private page: Page) {}

	dashboard(): Locator {
		return this.page.locator('app-dashboard');
	}

	activityHeatmap(): Locator {
		return this.dashboard().locator('my-activity-heatmap');
	}

	exerciseHeatmap(): Locator {
		return this.dashboard().locator('my-exercise-heatmap');
	}

	foodChartCard(): Locator {
		return this.dashboard().locator('my-food-chart-card');
	}

	weeklyTab(): Locator {
		return this.foodChartCard().getByRole('button', { name: 'Woche' });
	}

	monthlyTab(): Locator {
		return this.foodChartCard().getByRole('button', { name: 'Monat' });
	}

	foodChartLoadingState(): Locator {
		return this.foodChartCard().locator('.loading-state');
	}

	caloriesCanvas(): Locator {
		return this.foodChartCard().locator('#calories-canvas');
	}

	proteinCanvas(): Locator {
		return this.foodChartCard().locator('#protein-canvas');
	}

	async goto() {
		await this.page.goto(`${BASE_URL}/stats`);
		await this.page.waitForURL(/\/stats/);
	}
}
