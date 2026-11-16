/**
 * Autor: Simon Josef Cebula

 */
import type { Page, Locator } from 'playwright';
export class AdminFoodTrackingPage {
	constructor(private readonly page: Page) {}

	pageElement(): Locator {
		return this.page.locator('admin-foodtracking');
	}

	searchInput(): Locator {
		return this.pageElement().getByTestId('foodtracking-search-input');
	}

	newFoodBtn(): Locator {
		return this.pageElement().getByTestId('foodtracking-new-food-btn');
	}

	foodList(): Locator {
		return this.pageElement().getByTestId('foodtracking-food-list');
	}

	emptyState(): Locator {
		return this.pageElement().getByTestId('foodtracking-empty-state');
	}

	foodRows(): Locator {
		return this.pageElement().getByTestId('foodtracking-food-row');
	}

	firstDeleteBtn(): Locator {
		return this.pageElement().getByTestId('foodtracking-food-delete-btn').first();
	}

	confirmOverlay(): Locator {
		return this.pageElement().getByTestId('foodtracking-confirm-overlay');
	}

	confirmTitle(): Locator {
		return this.pageElement().getByTestId('foodtracking-confirm-title');
	}

	confirmCancelBtn(): Locator {
		return this.pageElement().getByTestId('foodtracking-confirm-cancel-btn');
	}

	createModal(): Locator {
		return this.pageElement().locator('food-create-modal');
	}

	createModalNameInput(): Locator {
		return this.createModal().getByTestId('foodtracking-create-name');
	}

	firstEditBtn(): Locator {
		return this.pageElement().getByTestId('foodtracking-food-edit-btn').first();
	}

	editModal(): Locator {
		return this.pageElement().locator('food-edit-modal');
	}

	editModalNameInput(): Locator {
		return this.editModal().getByTestId('foodtracking-edit-name');
	}

	sortPill(key: string): Locator {
		return this.pageElement().getByTestId(`foodtracking-sort-${key}-btn`);
	}

	errorMsg(): Locator {
		return this.pageElement().getByTestId('foodtracking-error-msg');
	}
}
