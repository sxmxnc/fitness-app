import { Page, Locator } from 'playwright';

export class AdminUserOverviewPage {
  constructor(private page: Page) {}

  adminOverview(): Locator {
    return this.page.locator('admin-overview');
  }

  filterNewest(): Locator {
    return this.page.getByTestId('profiles-sort-date-desc-btn');
  }

  filterOldest(): Locator {
    return this.page.getByTestId('profiles-sort-date-asc-btn');
  }

  filteractive(): Locator {
    return this.page.getByTestId('profiles-sort-active-btn');
  }

  filterInactive(): Locator {
    return this.page.getByTestId('profiles-sort-inactive-btn');
  }

  async searchForName(name: string): Promise<void> {
    await this.page.getByTestId('profiles-search-input').fill(name);
  }

  getFirstResultName(): Promise<string | null> {
    return this.page
      .getByTestId('profiles-user-list')
      .getByTestId('profiles-user-row')
      .locator('span.user-name')
      .first()
      .textContent();
  }

  getfirstUserStatus(): Locator {
    return this.page
      .getByTestId('profiles-user-list')
      .getByTestId('profiles-user-row')
      .first()
      .getByTestId('profiles-user-status-badge');
  }

  firstUserStatsButton(): Locator {
    return this.page
      .getByTestId('profiles-user-list')
      .getByTestId('profiles-user-row')
      .first()
      .getByTestId('profiles-user-stats-btn');
  }

  firstUsertoggleButton(): Locator {
    return this.page
      .getByTestId('profiles-user-list')
      .getByTestId('profiles-user-row')
      .first()
      .getByTestId('profiles-user-toggle-btn');
  }

  userList(): Locator {
    return this.page.getByTestId('profiles-user-list');
  }

  emptyState(): Locator {
    return this.page.getByTestId('profiles-empty-state');
  }

  loadingIndicator(): Locator {
    return this.page.getByTestId('profiles-loading');
  }

  errorMessage(): Locator {
    return this.page.getByTestId('profiles-error-msg');
  }

  sortPills(): Locator {
    return this.page.getByTestId('profiles-sort-pills');
  }

  allUserRows(): Locator {
    return this.page.getByTestId('profiles-user-list').getByTestId('profiles-user-row');
  }
}
