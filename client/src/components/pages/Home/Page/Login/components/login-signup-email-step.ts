import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LoginStep } from '../login.types.js';

/** Renders the email collection step for registration. */
@customElement('login-signup-email-step')
export class LoginSignupEmailStep extends LitElement {
	@property({ type: String }) email = '';
	@property({ type: String }) errorMsg = '';
	@property({ type: Boolean }) loading = false;

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	override render() {
		return html`
			<button class="back-link" data-testid="login-signup-email-back-btn" @click=${() => this.goTo('choose')}>
				← Zurück
			</button>
			<h1 class="card-title">Registrieren</h1>
			<p class="card-subtitle">Schritt 1 von 3 - Gib deine E-Mail-Adresse ein.</p>

			${this.errorMsg
				? html`
						<div class="error-box" data-testid="login-signup-email-error">
							${this.errorMsg}
							<br />
							<a @click=${() => this.goTo('signin')}>Stattdessen anmelden?</a>
						</div>
					`
				: ''}

			<div class="form-group">
				<label for="email">E-Mail-Adresse</label>
				<input
					id="email"
					data-testid="login-signup-email-input"
					type="email"
					placeholder="max@beispiel.de"
					.value=${this.email}
					@input=${this.onEmailInput}
					@keydown=${this.onEmailKeydown}
				/>
			</div>
			<button
				class="btn btn-primary"
				data-testid="login-signup-email-continue-btn"
				?disabled=${this.loading || !this.email}
				@click=${this.submitEmail}
			>
				${this.loading ? 'Prüfen…' : 'Weiter'}
			</button>
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
	 * Submits the email step when Enter is pressed.
	 * @param {KeyboardEvent} event Keyboard event from the email input.
	 */
	private onEmailKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') this.submitEmail();
	}

	/** Emits the email submission request. */
	private submitEmail() {
		this.dispatchEvent(new CustomEvent('signup-email-submit', { bubbles: true, composed: true }));
	}
}

declare global {
	/** Describes custom elements provided by this module. */
	interface HTMLElementTagNameMap {
		'login-signup-email-step': LoginSignupEmailStep;
	}
}
