/**
 * Autor: Simon Josef Cebula

 */
import type { Page, Locator } from 'playwright';
export class FoodTrackingPage {
	constructor(private readonly page: Page) {}

	foodtrackingElement(): Locator {
		return this.page.locator('app-foodtracking');
	}

	summaryCard(): Locator {
		return this.foodtrackingElement().locator('my-food-summary-card');
	}

	periodTabDaily(): Locator {
		return this.summaryCard().getByTestId('food-summary-tab-daily');
	}

	periodTabWeekly(): Locator {
		return this.summaryCard().getByTestId('food-summary-tab-weekly');
	}

	periodTabMonthly(): Locator {
		return this.summaryCard().getByTestId('food-summary-tab-monthly');
	}

	periodTabYearly(): Locator {
		return this.summaryCard().getByTestId('food-summary-tab-yearly');
	}

	summaryCalories(): Locator {
		return this.summaryCard().getByTestId('food-summary-calories');
	}

	fab(): Locator {
		return this.foodtrackingElement().locator('.fab');
	}

	entryForm(): Locator {
		return this.foodtrackingElement().locator('my-food-entry-form');
	}

	entryFormCloseBtn(): Locator {
		return this.entryForm().locator('.modal-close');
	}

	entryFormOverlay(): Locator {
		return this.entryForm().locator('.modal-overlay');
	}

	entryFormMealTypeBtns(): Locator {
		return this.entryForm().locator('.meal-type-btn');
	}

	entryFormModeBtns(): Locator {
		return this.entryForm().locator('.mode-btn');
	}

	entryFormQuantityInput(): Locator {
		return this.entryForm().getByTestId('food-entry-quantity');
	}

	summaryMacros(): Locator {
		return this.summaryCard().getByTestId('food-summary-macros');
	}
}
