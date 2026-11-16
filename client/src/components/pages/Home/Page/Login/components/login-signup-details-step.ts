import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LoginStep } from '../login.types.js';
import '../../../../../common/password-strength/password-strength-meter.js';

/** Renders the profile details step for registration. */
@customElement('login-signup-details-step')
export class LoginSignupDetailsStep extends LitElement {
	@property({ type: String }) errorMsg = '';
	@property({ type: Boolean }) loading = false;
	@property({ type: String }) signupPassword = '';

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	override render() {
		return html`
			<button
				class="back-link"
				data-testid="login-signup-details-back-btn"
				@click=${() => this.goTo('signup-email')}
			>
				← Zurück
			</button>
			<h1 class="card-title">Fast geschafft!</h1>
			<p class="card-subtitle">Schritt 2 von 3 - Vervollständige dein Profil.</p>

			${this.errorMsg
				? html`<div class="error-box" data-testid="login-signup-details-error">${this.errorMsg}</div>`
				: ''}

			<form @submit=${this.submitSignup}>
				<div class="form-row">
					<div class="form-group">
						<label for="firstName">Vorname</label>
						<input
							id="firstName"
							data-testid="login-signup-firstname-input"
							name="firstName"
							type="text"
							placeholder="Max"
							required
						/>
					</div>
					<div class="form-group">
						<label for="lastName">Nachname</label>
						<input
							id="lastName"
							data-testid="login-signup-lastname-input"
							name="lastName"
							type="text"
							placeholder="Mustermann"
							required
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="password">Passwort</label>
					<input
						id="password"
						data-testid="login-signup-password-input"
						name="password"
						type="password"
						autocomplete="off"
						.value=${this.signupPassword}
						@input=${this.onPasswordInput}
						placeholder="Mind. 8 Zeichen, 1 Großbuchstabe, 2 Zahlen, 1 Sonderzeichen"
						required
						aria-describedby="signup-password-strength"
					/>
					<div id="signup-password-strength">
						<password-strength-meter .password=${this.signupPassword}></password-strength-meter>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="weight">Gewicht (kg)</label>
						<input
							id="weight"
							data-testid="login-signup-weight-input"
							name="weight"
							type="number"
							placeholder="80"
							required
						/>
					</div>
					<div class="form-group">
						<label for="height">Größe (cm)</label>
						<input
							id="height"
							data-testid="login-signup-height-input"
							name="height"
							type="number"
							placeholder="180"
							required
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="birthDate">Geburtsdatum</label>
					<input
						id="birthDate"
						data-testid="login-signup-birthdate-input"
						name="birthDate"
						type="date"
						required
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="dailyCalorieGoal">Kalorien-Ziel (kcal)</label>
						<input
							id="dailyCalorieGoal"
							data-testid="login-signup-calorie-input"
							name="dailyCalorieGoal"
							type="number"
							placeholder="2200"
							required
						/>
					</div>
					<div class="form-group">
						<label for="dailyProteinGoal">Protein-Ziel (g)</label>
						<input
							id="dailyProteinGoal"
							data-testid="login-signup-protein-input"
							name="dailyProteinGoal"
							type="number"
							placeholder="140"
							required
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="dailyFatGoal">Fett-Ziel (g)</label>
						<input
							id="dailyFatGoal"
							data-testid="login-signup-fat-input"
							name="dailyFatGoal"
							type="number"
							placeholder="70"
							required
						/>
					</div>
					<div class="form-group">
						<label for="dailyCarbsGoal">Kohlenhydrat-Ziel (g)</label>
						<input
							id="dailyCarbsGoal"
							data-testid="login-signup-carbs-input"
							name="dailyCarbsGoal"
							type="number"
							placeholder="250"
							required
						/>
					</div>
				</div>

				<button
					class="btn btn-primary"
					data-testid="login-signup-submit-btn"
					type="submit"
					?disabled=${this.loading}
				>
					${this.loading ? 'Registrieren…' : 'Konto erstellen'}
				</button>
			</form>
		`;
	}

	/** Renders this component into the parent light DOM so the login card styles apply. */
	protected override createRenderRoot() {
		return this;
	}

	/**
	 * Emits the requested step transition.
	 * @param {LoginStep} step Target login flow step.
	 */
	private goTo(step: LoginStep) {
		this.dispatchEvent(new CustomEvent<LoginStep>('step-change', { detail: step, bubbles: true, composed: true }));
	}

	/**
	 * Emits the changed signup password value.
	 * @param {Event} event DOM input event.
	 */
	private onPasswordInput(event: Event) {
		this.dispatchEvent(
			new CustomEvent<string>('signup-password-change', {
				detail: (event.target as HTMLInputElement).value,
				bubbles: true,
				composed: true
			})
		);
	}

	/**
	 * Emits the signup form submission.
	 * @param {SubmitEvent} event Form submit event.
	 */
	private submitSignup(event: SubmitEvent) {
		event.preventDefault();
		this.dispatchEvent(
			new CustomEvent<HTMLFormElement>('signup-submit', {
				detail: event.target as HTMLFormElement,
				bubbles: true,
				composed: true
			})
		);
	}
}

declare global {
	/** Describes custom elements provided by this module. */
	interface HTMLElementTagNameMap {
		'login-signup-details-step': LoginSignupDetailsStep;
	}
}
