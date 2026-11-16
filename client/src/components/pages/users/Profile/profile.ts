/**
 * Autor: Luca Lammers

 */
import { LitElement, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './profile.css?inline';
import '../common/user-header/user-header';
import '../common/user-nav/user-nav';
import '../../../common/success-message/success-message.js';
import '../../../common/error-message/error-message.js';
import type { SuccessMessage } from '../../../common/success-message/success-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';
import '../../../common/password-strength/password-strength-meter.js';

import { BASE_API } from '../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../http-client.js';

type Card = 'goals' | 'info' | 'password';

type UserData = {
	firstName: string;
	lastName: string;
	email: string;
	age: number;
	weight: number;
	height: number;
	calorieGoal: number;
	protein: number;
	carbs: number;
	fat: number;
};

function ageFromBirthDate(birthDate: number): number {
	// 365.25 accounts for leap years
	return Math.floor((Date.now() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
}

@customElement('app-profile')
export class Profile extends LitElement {
	static readonly styles = [componentStyle];

	@consume({ context: httpClientContext }) private readonly http: HttpClient = new HttpClient();

	@query('success-message') private readonly successMsg!: SuccessMessage;
	@query('error-message') private readonly errorMsg!: ErrorMessage;

	@state() private openCards: Set<Card> = new Set(['goals', 'info', 'password']);
	@state() private editingCards: Set<Card> = new Set();

	@state() private user!: UserData;
	@state() private currentPassword = '';
	@state() private newPassword = '';
	@state() private confirmPassword = '';
	@state() private loading = false;

	private _savedUser: UserData | null = null;

	override connectedCallback() {
		super.connectedCallback();
		void this.init();
	}

	render() {
		if (!this.user) return html``;
		return html`
			<app-header></app-header>
			<div data-testid="profile-feedback">
				<success-message></success-message>
				<error-message></error-message>
			</div>
			<div class="page-content" data-testid="profile-page">
				<div class="profile-overview">
					<div class="person-info">
						<div class="avatar" data-testid="profile-avatar">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
						</div>
						<span class="username" data-testid="profile-username"
							>${this.user.firstName} ${this.user.lastName}</span
						>
					</div>

					<div class="card" data-testid="profile-goals-card">
						<button
							class="card-header"
							data-testid="profile-goals-toggle-btn"
							@click=${() => this.toggle('goals')}
						>
							<h2>Tagesziele</h2>
							<div class="card-header-actions">${this.editBtn('goals')} ${this.chevron('goals')}</div>
						</button>
						${this.openCards.has('goals') ? this.renderGoalsBody() : ''}
					</div>

					<div class="card" data-testid="profile-info-card">
						<button
							class="card-header"
							data-testid="profile-info-toggle-btn"
							@click=${() => this.toggle('info')}
						>
							<h2>Persönliche Daten</h2>
							<div class="card-header-actions">${this.editBtn('info')} ${this.chevron('info')}</div>
						</button>
						${this.openCards.has('info') ? this.renderInfoBody() : ''}
					</div>

					<div class="card" data-testid="profile-password-card">
						<button
							class="card-header"
							data-testid="profile-password-toggle-btn"
							@click=${() => this.toggle('password')}
						>
							<h2>Passwort ändern</h2>
							<div class="card-header-actions">
								${this.editBtn('password')} ${this.chevron('password')}
							</div>
						</button>
						${this.openCards.has('password') ? this.renderPasswordBody() : ''}
					</div>

					<button class="btn-logout" data-testid="profile-logout-btn" @click=${this.logout}>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						Abmelden
					</button>
				</div>
			</div>
			<app-nav></app-nav>
		`;
	}

	private async init() {
		const token = localStorage.getItem('token');
		if (!token) {
			globalThis.location.href = '/';
			return;
		}
		try {
			const res = await this.http.get(`${BASE_API}/auth/verify`);
			if (!res.ok) {
				localStorage.removeItem('token');
				globalThis.location.href = '/';
				return;
			}
		} catch {
			globalThis.location.href = '/';
			return;
		}
		await this.loadUserData();
	}

	private async loadUserData() {
		const id = localStorage.getItem('userId')!;
		const res = await this.http.get(`${BASE_API}/users/data/${id}`);
		const raw = await res.json();
		this.user = {
			firstName: raw.firstName,
			lastName: raw.lastName,
			email: raw.email,
			weight: raw.weight,
			height: raw.height,
			age: ageFromBirthDate(raw.birthDate),
			calorieGoal: raw.dailyCalorieGoal,
			protein: raw.dailyProteinGoal,
			carbs: raw.dailyCarbsGoal,
			fat: raw.dailyFatGoal
		};
		this._savedUser = { ...this.user };
	}

	private toggle(card: Card) {
		const nextOpen = new Set(this.openCards);
		const closing = nextOpen.has(card);
		closing ? nextOpen.delete(card) : nextOpen.add(card);
		this.openCards = nextOpen;
		if (closing && this.editingCards.has(card)) {
			const nextEditing = new Set(this.editingCards);
			nextEditing.delete(card);
			this.editingCards = nextEditing;
			if (card === 'password') {
				this.currentPassword = '';
				this.newPassword = '';
				this.confirmPassword = '';
			} else if (this._savedUser) {
				this.user = { ...this._savedUser };
			}
		}
	}

	private toggleEdit(card: Card, e: Event) {
		e.stopPropagation();
		const next = new Set(this.editingCards);
		const cancelling = next.has(card);
		cancelling ? next.delete(card) : next.add(card);
		this.editingCards = next;
		if (cancelling) {
			if (card === 'password') {
				this.currentPassword = '';
				this.newPassword = '';
				this.confirmPassword = '';
			} else if (this._savedUser) {
				this.user = { ...this._savedUser };
			}
		}
	}

	private async savePersonalInfo() {
		const id = localStorage.getItem('userId')!;
		this.loading = true;
		try {
			const res = await this.http.patch(`${BASE_API}/users/${id}`, {
				firstName: this.user.firstName,
				lastName: this.user.lastName,
				email: this.user.email
			});
			if (res.ok) {
				this._savedUser = { ...this.user };
				const next = new Set(this.editingCards);
				next.delete('info');
				this.editingCards = next;
				this.successMsg.show('Erfolgreich gespeichert.');
			} else {
				const data = (await res.json().catch(() => ({}))) as { message?: string };
				this.errorMsg.show(data.message ?? 'Änderungen konnten nicht gespeichert werden.');
			}
		} catch {
			this.errorMsg.show('Server nicht erreichbar.');
		} finally {
			this.loading = false;
		}
	}

	private validateStats(): string | null {
		if (this.user.age < 1 || this.user.age > 120) return 'Das Alter muss zwischen 1 und 120 liegen.';
		if (this.user.weight <= 0) return 'Das Gewicht muss größer als 0 sein.';
		if (this.user.height <= 0) return 'Die Größe muss größer als 0 sein.';
		if (this.user.calorieGoal < 0) return 'Das Kalorienziel darf nicht negativ sein.';
		if (this.user.protein < 0) return 'Das Proteinziel darf nicht negativ sein.';
		if (this.user.carbs < 0) return 'Das Kohlenhydratziel darf nicht negativ sein.';
		if (this.user.fat < 0) return 'Das Fettziel darf nicht negativ sein.';
		return null;
	}

	private async saveStats() {
		const err = this.validateStats();
		if (err) {
			this.errorMsg.show(err);
			return;
		}
		const id = localStorage.getItem('userId')!;
		this.loading = true;
		const birthDate = Math.round(Date.now() - this.user.age * 365.25 * 24 * 60 * 60 * 1000);
		try {
			const res = await this.http.patch(`${BASE_API}/usersStats/${id}/stats`, {
				weight: this.user.weight,
				height: this.user.height,
				birthDate,
				dailyCalorieGoal: this.user.calorieGoal,
				dailyProteinGoal: this.user.protein,
				dailyFatGoal: this.user.fat,
				dailyCarbsGoal: this.user.carbs
			});
			if (res.ok) {
				this._savedUser = { ...this.user };
				const next = new Set(this.editingCards);
				next.delete('goals');
				this.editingCards = next;
				this.successMsg.show('Erfolgreich gespeichert.');
			} else {
				const data = (await res.json().catch(() => ({}))) as { message?: string };
				this.errorMsg.show(data.message ?? 'Änderungen konnten nicht gespeichert werden.');
			}
		} catch {
			this.errorMsg.show('Server nicht erreichbar.');
		} finally {
			this.loading = false;
		}
	}

	private async savePassword() {
		if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
			this.errorMsg.show('Bitte alle Felder ausfüllen.');
			return;
		}
		if (this.newPassword !== this.confirmPassword) {
			this.errorMsg.show('Die neuen Passwörter stimmen nicht überein.');
			return;
		}
		const pwRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$/;
		if (!pwRules.test(this.newPassword)) {
			this.errorMsg.show('Mind. 12 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.');
			return;
		}
		const id = localStorage.getItem('userId')!;
		this.loading = true;
		try {
			const res = await this.http.patch(`${BASE_API}/users/${id}/password`, {
				currentPassword: this.currentPassword,
				newPassword: this.newPassword,
				repeatPassword: this.confirmPassword
			});
			if (res.ok) {
				this.currentPassword = '';
				this.newPassword = '';
				this.confirmPassword = '';
				this.successMsg.show('Passwort erfolgreich geändert.');
			} else {
				const data = (await res.json().catch(() => ({}))) as { message?: string };
				this.errorMsg.show(data.message ?? 'Passwort konnte nicht geändert werden.');
			}
		} catch {
			this.errorMsg.show('Server nicht erreichbar.');
		} finally {
			this.loading = false;
		}
	}

	private async logout() {
		try {
			await this.http.post(`${BASE_API}/auth/logout`);
		} catch {
			// intentionally empty
		}
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		globalThis.location.href = '/';
	}

	private editBtn(card: Card) {
		const editing = this.editingCards.has(card);
		return html` <button
			class="btn-edit ${editing ? 'active' : ''}"
			data-testid="profile-${card}-edit-btn"
			@click=${(e: Event) => this.toggleEdit(card, e)}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
				<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
			</svg>
			${editing ? 'Abbrechen' : 'Bearbeiten'}
		</button>`;
	}

	private renderGoalsBody() {
		return html`
			<div class="card-body">
				<div class="form-row">
					<div class="form-group">
						<label>Alter</label>
						<div class="input-wrap">
							<input
								type="number"
								data-testid="profile-goals-age-input"
								min="1"
								max="120"
								.value=${String(this.user.age)}
								?disabled=${!this.editingCards.has('goals')}
								@input=${(e: Event) => {
									this.user = { ...this.user, age: Number((e.target as HTMLInputElement).value) };
								}}
							/>
							<span class="suffix">J.</span>
						</div>
					</div>
					<div class="form-group">
						<label>Gewicht</label>
						<div class="input-wrap">
							<input
								type="number"
								data-testid="profile-goals-weight-input"
								min="1"
								.value=${String(this.user.weight)}
								?disabled=${!this.editingCards.has('goals')}
								@input=${(e: Event) => {
									this.user = { ...this.user, weight: Number((e.target as HTMLInputElement).value) };
								}}
							/>
							<span class="suffix">kg</span>
						</div>
					</div>
					<div class="form-group">
						<label>Größe</label>
						<div class="input-wrap">
							<input
								type="number"
								data-testid="profile-goals-height-input"
								min="1"
								.value=${String(this.user.height)}
								?disabled=${!this.editingCards.has('goals')}
								@input=${(e: Event) => {
									this.user = { ...this.user, height: Number((e.target as HTMLInputElement).value) };
								}}
							/>
							<span class="suffix">cm</span>
						</div>
					</div>
				</div>
				<div class="form-group">
					<label>Kalorienziel</label>
					<div class="input-wrap full">
						<input
							type="number"
							data-testid="profile-goals-calorie-input"
							min="0"
							.value=${String(this.user.calorieGoal)}
							?disabled=${!this.editingCards.has('goals')}
							@input=${(e: Event) => {
								this.user = { ...this.user, calorieGoal: Number((e.target as HTMLInputElement).value) };
							}}
						/>
						<span class="suffix">kcal</span>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label>Protein</label>
						<div class="input-wrap">
							<input
								type="number"
								data-testid="profile-goals-protein-input"
								min="0"
								.value=${String(this.user.protein)}
								?disabled=${!this.editingCards.has('goals')}
								@input=${(e: Event) => {
									this.user = { ...this.user, protein: Number((e.target as HTMLInputElement).value) };
								}}
							/>
							<span class="suffix">g</span>
						</div>
					</div>
					<div class="form-group">
						<label>Kohlenhydrate</label>
						<div class="input-wrap">
							<input
								type="number"
								data-testid="profile-goals-carbs-input"
								min="0"
								.value=${String(this.user.carbs)}
								?disabled=${!this.editingCards.has('goals')}
								@input=${(e: Event) => {
									this.user = { ...this.user, carbs: Number((e.target as HTMLInputElement).value) };
								}}
							/>
							<span class="suffix">g</span>
						</div>
					</div>
					<div class="form-group">
						<label>Fett</label>
						<div class="input-wrap">
							<input
								type="number"
								data-testid="profile-goals-fat-input"
								min="0"
								.value=${String(this.user.fat)}
								?disabled=${!this.editingCards.has('goals')}
								@input=${(e: Event) => {
									this.user = { ...this.user, fat: Number((e.target as HTMLInputElement).value) };
								}}
							/>
							<span class="suffix">g</span>
						</div>
					</div>
				</div>
				${this.editingCards.has('goals')
					? html`<button
							class="btn-save"
							data-testid="profile-goals-save-btn"
							?disabled=${this.loading}
							@click=${this.saveStats}
						>
							Speichern
						</button>`
					: ''}
			</div>
		`;
	}

	private renderInfoBody() {
		return html`
			<div class="card-body">
				<div class="form-row">
					<div class="form-group">
						<label>Vorname</label>
						<div class="input-wrap">
							<input
								type="text"
								data-testid="profile-info-firstname-input"
								.value=${this.user.firstName}
								?disabled=${!this.editingCards.has('info')}
								@input=${(e: Event) => {
									this.user = { ...this.user, firstName: (e.target as HTMLInputElement).value };
								}}
							/>
						</div>
					</div>
					<div class="form-group">
						<label>Nachname</label>
						<div class="input-wrap">
							<input
								type="text"
								data-testid="profile-info-lastname-input"
								.value=${this.user.lastName}
								?disabled=${!this.editingCards.has('info')}
								@input=${(e: Event) => {
									this.user = { ...this.user, lastName: (e.target as HTMLInputElement).value };
								}}
							/>
						</div>
					</div>
				</div>
				<div class="form-group">
					<label>E-Mail</label>
					<div class="input-wrap full">
						<input
							type="email"
							data-testid="profile-info-email-input"
							.value=${this.user.email}
							?disabled=${!this.editingCards.has('info')}
							@input=${(e: Event) => {
								this.user = { ...this.user, email: (e.target as HTMLInputElement).value };
							}}
						/>
					</div>
				</div>
				${this.editingCards.has('info')
					? html`<button
							class="btn-save"
							data-testid="profile-info-save-btn"
							?disabled=${this.loading}
							@click=${this.savePersonalInfo}
						>
							Speichern
						</button>`
					: ''}
			</div>
		`;
	}

	private renderPasswordBody() {
		return html`
			<div class="card-body">
				<div class="form-group">
					<label>Aktuelles Passwort</label>
					<div class="input-wrap full">
						<input
							type="password"
							autocomplete="off"
							data-testid="profile-password-current-input"
							placeholder="••••••••"
							.value=${this.currentPassword}
							?disabled=${!this.editingCards.has('password')}
							@input=${(e: Event) => {
								this.currentPassword = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>
				</div>
				<div class="form-group">
					<label>Neues Passwort</label>
					<div class="input-wrap full">
						<input
							type="password"
							autocomplete="off"
							data-testid="profile-password-new-input"
							placeholder="••••••••"
							.value=${this.newPassword}
							?disabled=${!this.editingCards.has('password')}
							@input=${(e: Event) => {
								this.newPassword = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>
				</div>
				<div class="form-group">
					<label>Neues Passwort bestätigen</label>
					<div class="input-wrap full">
						<input
							type="password"
							autocomplete="off"
							data-testid="profile-password-confirm-input"
							placeholder="••••••••"
							.value=${this.confirmPassword}
							?disabled=${!this.editingCards.has('password')}
							@input=${(e: Event) => {
								this.confirmPassword = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>
				</div>
				${this.editingCards.has('password')
					? html`<password-strength-meter
								.password=${this.newPassword}
								.confirmation=${this.confirmPassword}
								show-confirmation
							></password-strength-meter>
							<button
								class="btn-save"
								data-testid="profile-password-save-btn"
								?disabled=${this.loading}
								@click=${this.savePassword}
							>
								Speichern
							</button>`
					: ''}
			</div>
		`;
	}

	private chevron(card: Card) {
		return html` <svg
			class="chevron ${this.openCards.has(card) ? 'open' : ''}"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>`;
	}
}
