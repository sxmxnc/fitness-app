import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LoginStep } from '../login.types.js';
import { SECURITY_QUESTIONS } from '../security-questions.js';

/** Renders the security question step for registration. */
@customElement('login-signup-security-step')
export class LoginSignupSecurityStep extends LitElement {
	@property({ type: String }) errorMsg = '';
	@property({ type: Boolean }) loading = false;

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	override render() {
		return html`
			<button
				class="back-link"
				data-testid="login-signup-security-back-btn"
				@click=${() => this.goTo('signup-details')}
			>
				← Zurück
			</button>
			<h1 class="card-title">Sicherheitsfrage</h1>
			<p class="card-subtitle">Schritt 3 von 3 - Wähle eine Frage für den Passwort-Reset.</p>

			${this.errorMsg
				? html`<div class="error-box" data-testid="login-signup-security-error">${this.errorMsg}</div>`
				: ''}

			<form @submit=${this.submitSignup}>
				<div class="form-group">
					<label for="securityQuestionKey">Sicherheitsfrage</label>
					<select
						id="securityQuestionKey"
						data-testid="login-signup-security-question-select"
						name="securityQuestionKey"
						required
					>
						<option value="">Bitte auswählen</option>
						${SECURITY_QUESTIONS.map(
							question => html`<option value=${question.key}>${question.label}</option>`
						)}
					</select>
				</div>

				<div class="form-group">
					<label for="securityAnswer">Antwort</label>
					<input
						id="securityAnswer"
						data-testid="login-signup-security-answer-input"
						name="securityAnswer"
						type="text"
						autocomplete="off"
						required
					/>
				</div>

				<button
					class="btn btn-primary"
					data-testid="login-signup-security-submit-btn"
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
	 * Emits the security form submission.
	 * @param {SubmitEvent} event Form submit event.
	 */
	private submitSignup(event: SubmitEvent) {
		event.preventDefault();
		this.dispatchEvent(
			new CustomEvent<HTMLFormElement>('signup-security-submit', {
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
		'login-signup-security-step': LoginSignupSecurityStep;
	}
}
