import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LoginStep } from '../login.types.js';

/** Renders the sign-in step. */
@customElement('login-signin-step')
export class LoginSigninStep extends LitElement {
	@property({ type: String }) email = '';
	@property({ type: String }) errorMsg = '';
	@property({ type: String }) successMsg = '';
	@property({ type: String }) signinPassword = '';
	@property({ type: Boolean }) loading = false;

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	override render() {
		return html`
			<button class="back-link" data-testid="login-signin-back-btn" @click=${() => this.goTo('choose')}>
				← Zurück
			</button>
			<h1 class="card-title">Anmelden</h1>
			<p class="card-subtitle">Gib deine Zugangsdaten ein.</p>

			${this.successMsg
				? html`
						<div
							class="error-box"
							data-testid="login-signin-success-msg"
							style="background:#efffef; border-color:#27ae60; color:#1a6b2f;"
						>
							${this.successMsg}
						</div>
					`
				: ''}
			${this.errorMsg
				? html`<div class="error-box" data-testid="login-signin-error-msg">${this.errorMsg}</div>`
				: ''}

			<div class="form-group">
				<label for="signin-email">E-Mail-Adresse</label>
				<input
					id="signin-email"
					data-testid="login-signin-email-input"
					type="email"
					placeholder="max@beispiel.de"
					.value=${this.email}
					@input=${this.onEmailInput}
				/>
			</div>
			<div class="form-group">
				<label for="signin-password">Passwort</label>
				<input
					id="signin-password"
					data-testid="login-signin-password-input"
					type="password"
					autocomplete="off"
					placeholder="••••••••"
					@input=${this.onPasswordInput}
				/>
			</div>
			<button
				class="btn btn-primary"
				data-testid="login-signin-submit-btn"
				?disabled=${this.loading || !this.email || !this.signinPassword}
				@click=${this.submitSignin}
			>
				${this.loading ? 'Anmelden…' : 'Anmelden'}
			</button>

			<p class="divider">
				<a data-testid="login-forgot-password-link" href="/forgot-password">Passwort vergessen?</a>
			</p>

			<p class="divider">
				Noch kein Konto?
				<a data-testid="login-signin-register-link" @click=${() => this.goTo('signup-email')}>Registrieren</a>
			</p>
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
	 * Emits the changed email value.
	 * @param {Event} event DOM input event.
	 */
	private onEmailInput(event: Event) {
		this.dispatchEvent(
			new CustomEvent<string>('email-change', {
				detail: (event.target as HTMLInputElement).value,
				bubbles: true,
				composed: true
			})
		);
	}

	/**
	 * Emits the changed sign-in password value.
	 * @param {Event} event DOM input event.
	 */
	private onPasswordInput(event: Event) {
		this.dispatchEvent(
			new CustomEvent<string>('signin-password-change', {
				detail: (event.target as HTMLInputElement).value,
				bubbles: true,
				composed: true
			})
		);
	}

	/** Emits the sign-in submission request. */
	private submitSignin() {
		this.dispatchEvent(new CustomEvent('signin-submit', { bubbles: true, composed: true }));
	}
}

declare global {
	/** Describes custom elements provided by this module. */
	interface HTMLElementTagNameMap {
		'login-signin-step': LoginSigninStep;
	}
}
