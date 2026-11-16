/**
 * Autor: Luca Lammers

 */
import { Page } from 'playwright';
import { loginAsUser } from '../../Common/login';

export class ProfilePage {
	constructor(private readonly page: Page) {}

	async goto() {
		await loginAsUser(this.page);
	}

	age() {
		return this.page.getByTestId('profile-goals-age-input');
	}

	weight() {
		return this.page.getByTestId('profile-goals-weight-input');
	}

	height() {
		return this.page.getByTestId('profile-goals-height-input');
	}
	
    calorieGoal() {
		return this.page.getByTestId('profile-goals-calorie-input');
	}
	
    proteinGoal() {
		return this.page.getByTestId('profile-goals-protein-input');
	}
	
    carbGoal() {
		return this.page.getByTestId('profile-goals-carbs-input');
	}
	
    fatGoal() {
		return this.page.getByTestId('profile-goals-fat-input');
	}
	
    firstName() {
		return this.page.getByTestId('profile-info-firstname-input');
	}
	
    lastName() {
		return this.page.getByTestId('profile-info-lastname-input');
	}
	
    email() {
		return this.page.getByTestId('profile-info-email-input');
	}
	
    currentPassword() {
		return this.page.getByTestId('profile-password-current-input');
	}
	
    newPassword() {
		return this.page.getByTestId('profile-password-new-input');
	}
	
    newPasswordConfirm() {
		return this.page.getByTestId('profile-password-confirm-input');
	}
	
    async logout() {
		await this.page.getByTestId('profile-logout-btn').click();
		await this.page.waitForURL(url => url.pathname === '/');
	}

	async changeStateDailyGoals() {
		await this.page.getByTestId('profile-goals-toggle-btn').click();
	}
	
    async changeStatePersonalInfo() {
		await this.page.getByTestId('profile-info-toggle-btn').click();
	}

	async changeStateChangePassword() {
		await this.page.getByTestId('profile-password-toggle-btn').click();
	}

	async editDailyGoals() {
		await this.page.getByTestId('profile-goals-edit-btn').click();
	}
	
    async editPersonalInfo() {
		await this.page.getByTestId('profile-info-edit-btn').click();
	}
	
    async editChangePassword() {
		await this.page.getByTestId('profile-password-edit-btn').click();
	}
	
    async saveDailyGoals() {
		await this.page.getByTestId('profile-goals-save-btn').click();
	}
	
    async savePersonalInfo() {
		await this.page.getByTestId('profile-info-save-btn').click();
	}
	
    async saveChangePassword() {
		await this.page.getByTestId('profile-password-save-btn').click();
	}
	
    DailyGoalsSaveSuccsessMessage() {
		return this.page.locator('[data-testid="profile-feedback"] .alert');
	}

    PersonalInfoSaveSuccsessMessage() {
		return this.page.locator('[data-testid="profile-feedback"] .alert');
	}

    ChangePasswordSaveSuccsessMessage() {
		return this.page.locator('[data-testid="profile-feedback"] .alert');
	}
	
	UserName() {
		return this.page.getByTestId('profile-username');
	}

	GoalsCard() {
		return this.page.getByTestId('profile-goals-card');
	}

	PersonelInfoCard() {
		return this.page.getByTestId('profile-info-card');
	}

	PasswordCard() {
		return this.page.getByTestId('profile-password-card');
	}
}
