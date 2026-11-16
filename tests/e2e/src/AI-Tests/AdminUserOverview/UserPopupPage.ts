import { Page, Locator } from 'playwright';

export class UserPopupPage {
  constructor(private page: Page) {}

  popup(): Locator {
    return this.page.getByTestId('user-popup');
  }

  popupOverlay(): Locator {
    return this.page.getByTestId('user-popup-overlay');
  }

  popupName(): Locator {
    return this.page.getByTestId('user-popup-name');
  }

  popupEmail(): Locator {
    return this.page.getByTestId('user-popup-email');
  }

  popupCloseBtn(): Locator {
    return this.page.getByTestId('user-popup-close-btn');
  }

  popupTabData(): Locator {
    return this.page.getByTestId('user-popup-tab-data');
  }

  popupTabOverview(): Locator {
    return this.page.getByTestId('user-popup-tab-overview');
  }

  popupLoading(): Locator {
    return this.page.getByTestId('user-popup-loading');
  }

  popupDataGrid(): Locator {
    return this.page.getByTestId('user-popup-data-grid');
  }

  popupStatRegistered(): Locator {
    return this.page.getByTestId('user-popup-stat-registered');
  }

  popupStatStatus(): Locator {
    return this.page.getByTestId('user-popup-stat-status');
  }

  popupStatWeight(): Locator {
    return this.page.getByTestId('user-popup-stat-weight');
  }

  popupStatHeight(): Locator {
    return this.page.getByTestId('user-popup-stat-height');
  }

  popupStatBirthdate(): Locator {
    return this.page.getByTestId('user-popup-stat-birthdate');
  }

  popupStatCalorie(): Locator {
    return this.page.getByTestId('user-popup-stat-calorie');
  }

  popupStatProtein(): Locator {
    return this.page.getByTestId('user-popup-stat-protein');
  }

  popupStatFat(): Locator {
    return this.page.getByTestId('user-popup-stat-fat');
  }

  popupStatCarbs(): Locator {
    return this.page.getByTestId('user-popup-stat-carbs');
  }

  popupEmptyState(): Locator {
    return this.page.getByTestId('user-popup-empty-state');
  }

  popupOverviewContent(): Locator {
    return this.page.getByTestId('user-popup-overview');
  }

  popupStatTotalLogins(): Locator {
    return this.page.getByTestId('user-popup-stat-total-logins');
  }

  popupStatAvgDuration(): Locator {
    return this.page.getByTestId('user-popup-stat-avg-duration');
  }

  popupStatStreak(): Locator {
    return this.page.getByTestId('user-popup-stat-streak');
  }
}
