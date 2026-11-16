import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { LoginStep } from '../login.types.js';

/** Renders the initial login choice step. */
@customElement('login-choose-step')
export class LoginChooseStep extends LitElement {
	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	override render() {
		return html`
			<h1 class="card-title">Willkommen</h1>
			<p class="card-subtitle">Melde dich an oder erstelle ein neues Konto.</p>
			<div class="btn-group">
				<button
					class="btn btn-primary"
					data-testid="login-choose-register-btn"
					@click=${() => this.goTo('signup-email')}
				>
					Registrieren
				</button>
				<button
					class="btn btn-secondary"
					data-testid="login-choose-signin-btn"
					@click=${() => this.goTo('signin')}
				>
					Anmelden
				</button>
			</div>
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
}

declare global {
	/** Describes custom elements provided by this module. */
	interface HTMLElementTagNameMap {
		'login-choose-step': LoginChooseStep;
	}
}
