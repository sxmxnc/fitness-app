import { Page, Locator } from 'playwright';

export class AdminDashboardPage {
  constructor(private page: Page) {}

  adminOverview(): Locator {
    return this.page.locator('admin-overview');
  }

  bentoDashboard(): Locator {
    return this.adminOverview().getByTestId('admin-dashboard-bento');
  }

  cardActiveSessions(): Locator {
    return this.adminOverview().getByTestId('card-active-sessions');
  }

  cardUserActivity(): Locator {
    return this.adminOverview().getByTestId('card-user-activity');
  }

  cardSessionsByDay(): Locator {
    return this.adminOverview().getByTestId('card-sessions-by-day');
  }

  cardPopularTimes(): Locator {
    return this.adminOverview().getByTestId('card-popular-times');
  }

  cardDailySessions(): Locator {
    return this.adminOverview().getByTestId('card-daily-sessions');
  }

  activeSessionsTitle(): Locator {
    return this.cardActiveSessions().getByTestId('active-sessions-title');
  }

  activeSessionsRing(): Locator {
    return this.cardActiveSessions().getByTestId('active-sessions-ring');
  }

  activeSessionsCount(): Locator {
    return this.cardActiveSessions().getByTestId('active-sessions-count');
  }

  dailySessionsTitle(): Locator {
    return this.cardDailySessions().getByTestId('daily-sessions-title');
  }

  dailySessionsFromInput(): Locator {
    return this.cardDailySessions().getByTestId('sessions-from-input');
  }

  dailySessionsToInput(): Locator {
    return this.cardDailySessions().getByTestId('sessions-to-input');
  }

  dailySessionsRefreshBtn(): Locator {
    return this.cardDailySessions().getByTestId('sessions-refresh-btn');
  }

  dailySessionsErrorMsg(): Locator {
    return this.cardDailySessions().getByTestId('sessions-error-msg');
  }

  dailySessionsCanvas(): Locator {
    return this.cardDailySessions().getByTestId('sessions-chart-canvas');
  }

  userActivityTitle(): Locator {
    return this.cardUserActivity().getByTestId('user-activity-title');
  }

  userActivityFromInput(): Locator {
    return this.cardUserActivity().getByTestId('activity-from-input');
  }

  userActivityToInput(): Locator {
    return this.cardUserActivity().getByTestId('activity-to-input');
  }

  userActivityRefreshBtn(): Locator {
    return this.cardUserActivity().getByTestId('activity-refresh-btn');
  }

  userActivityErrorMsg(): Locator {
    return this.cardUserActivity().getByTestId('activity-error-msg');
  }

  userActivityCanvas(): Locator {
    return this.cardUserActivity().getByTestId('activity-chart-canvas');
  }

  sessionsByDayTitle(): Locator {
    return this.cardSessionsByDay().getByTestId('sessions-by-day-title');
  }

  sessionsByDayCanvas(): Locator {
    return this.cardSessionsByDay().getByTestId('sessions-by-day-canvas');
  }

  popularTimesTitle(): Locator {
    return this.cardPopularTimes().getByTestId('popular-times-title');
  }

  popularTimesCanvas(): Locator {
    return this.cardPopularTimes().getByTestId('popular-times-canvas');
  }

  get signInError(): Promise<string | null> {
    return this.page.getByTestId('login-signin-error-msg').textContent();
  }

  async setDateInput(locator: Locator, isoDate: string): Promise<void> {
    await locator.evaluate((el: HTMLInputElement, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, isoDate);
  }
}
