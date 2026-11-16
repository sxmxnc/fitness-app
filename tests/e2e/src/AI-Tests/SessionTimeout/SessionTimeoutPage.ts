import { Page } from 'playwright';
import { loginAsUser } from '../../Common/login';

export const TIMEOUT_MS = 10 * 60 * 1000;
export const WARNING_MS = 10 * 1000; 
export const WARNING_THRESHOLD = TIMEOUT_MS - WARNING_MS; // When warning appears

export class SessionTimeoutPage {
	constructor(private page: Page) {}

	async gotoAsUser() {
		await loginAsUser(this.page);
		await this.page.waitForLoadState('networkidle');
	}

	overlay() {
		return this.page.getByTestId('session-timeout-overlay');
	}

	countdown() {
		return this.page.getByTestId('session-timeout-countdown');
	}

	stayLoggedInBtn() {
		return this.page.getByTestId('session-timeout-stay-btn');
	}

	async clickStayLoggedIn() {
		await this.stayLoggedInBtn().click({ force: true });
	}
}
