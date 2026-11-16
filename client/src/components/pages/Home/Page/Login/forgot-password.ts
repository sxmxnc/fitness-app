import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './login.css?inline';
import { BASE_API } from '../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../http-client.js';
import { Router, routerContext } from '../../../../../router.js';
import '../../../../common/password-strength/password-strength-meter.js';

type ForgotStep = 'identify' | 'answer' | 'reset';

const neutralResetError = 'Die Angaben konnten nicht bestätigt werden.';

/** Password reset flow using security questions and short-lived server tokens. */
@customElement('forgot-password')
export class ForgotPasswordPage extends LitElement {
	static styles = [
		componentStyle,
		css`
			:host {
				display: block;
			}
		`
	];

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;
	@consume({ context: routerContext }) private router!: Router;

	@state() private step: ForgotStep = 'identify';
	@state() private email = '';
	@state() private question = '';
	@state() private answer = '';
	@state() private newPassword = '';
	@state() private repeatPassword = '';
	@state() private token = '';
	@state() private errorMsg = '';
	@state() private successMsg = '';
	@state() private loading = false;

	/** Initializes direct token links if present. */
	override connectedCallback() {
		super.connectedCallback();
		const params = new URLSearchParams(window.location.search);
		const token = params.get('token');
		if (token) {
			this.token = token;
			this.step = 'reset';
		}
	}

	/**
	 * Renders the reset page.
	 * @returns {TemplateResult<1>} The Lit template.
	 */
	override render() {
		return html`
			<div class="page" data-testid="forgot-password-page">
				<div class="card" data-testid="forgot-password-card">
					<div class="card-logo">
						<img src="/favicon.png" alt="Logo" width="24" height="24" />
						Food &amp; Workout Tracker
					</div>
					${this.renderStep()}
				</div>
			</div>
		`;
	}

	private renderStep() {
		if (this.step === 'answer') return this.renderAnswerStep();
		if (this.step === 'reset') return this.renderResetStep();
		return this.renderIdentifyStep();
	}

	private renderIdentifyStep() {
		return html`
			<button class="back-link" data-testid="forgot-back-login" @click=${this.goToLogin}>← Zurück</button>
			<h1 class="card-title">Passwort vergessen?</h1>
			<p class="card-subtitle">Gib deine E-Mail-Adresse ein.</p>

			${this.renderMessages()}

			<form @submit=${this.requestQuestion}>
				<div class="form-group">
					<label for="forgot-email">E-Mail-Adresse</label>
					<input
						id="forgot-email"
						data-testid="forgot-email-input"
						type="email"
						.value=${this.email}
						@input=${(event: Event) => (this.email = (event.target as HTMLInputElement).value)}
						required
					/>
				</div>
				<button
					class="btn btn-primary"
					data-testid="forgot-request-question-btn"
					type="submit"
					?disabled=${this.loading || !this.email}
				>
					${this.loading ? 'Prüfen…' : 'Weiter'}
				</button>
			</form>
		`;
	}

	private renderAnswerStep() {
		return html`
			<button class="back-link" data-testid="forgot-answer-back-btn" @click=${() => (this.step = 'identify')}>
				← Zurück
			</button>
			<h1 class="card-title">Sicherheitsfrage</h1>
			<p class="card-subtitle" data-testid="forgot-security-question">${this.question}</p>

			${this.renderMessages()}

			<form @submit=${this.verifyAnswer}>
				<div class="form-group">
					<label for="forgot-answer">Antwort</label>
					<input
						id="forgot-answer"
						data-testid="forgot-answer-input"
						type="text"
						autocomplete="off"
						.value=${this.answer}
						@input=${(event: Event) => (this.answer = (event.target as HTMLInputElement).value)}
						required
					/>
				</div>
				<button
					class="btn btn-primary"
					data-testid="forgot-verify-answer-btn"
					type="submit"
					?disabled=${this.loading || !this.answer}
				>
					${this.loading ? 'Prüfen…' : 'Antwort prüfen'}
				</button>
			</form>
		`;
	}

	private renderResetStep() {
		return html`
			<button class="back-link" data-testid="forgot-reset-back-btn" @click=${this.goToLogin}>← Zurück</button>
			<h1 class="card-title">Neues Passwort</h1>
			<p class="card-subtitle">Vergib ein neues Passwort für dein Konto.</p>

			${this.renderMessages()}

			<form @submit=${this.resetPassword}>
				<div class="form-group">
					<label for="forgot-new-password">Neues Passwort</label>
					<input
						id="forgot-new-password"
						data-testid="forgot-new-password-input"
						type="password"
						autocomplete="off"
						.value=${this.newPassword}
						@input=${(event: Event) => (this.newPassword = (event.target as HTMLInputElement).value)}
						required
						aria-describedby="forgot-password-strength"
					/>
					<div id="forgot-password-strength">
						<password-strength-meter .password=${this.newPassword}></password-strength-meter>
					</div>
				</div>
				<div class="form-group">
					<label for="forgot-repeat-password">Passwort bestätigen</label>
					<input
						id="forgot-repeat-password"
						data-testid="forgot-repeat-password-input"
						type="password"
						autocomplete="off"
						.value=${this.repeatPassword}
						@input=${(event: Event) => (this.repeatPassword = (event.target as HTMLInputElement).value)}
						required
					/>
				</div>
				<button
					class="btn btn-primary"
					data-testid="forgot-reset-password-btn"
					type="submit"
					?disabled=${this.loading || !this.newPassword || !this.repeatPassword}
				>
					${this.loading ? 'Speichern…' : 'Passwort speichern'}
				</button>
			</form>
		`;
	}

	private renderMessages() {
		return html`
			${this.successMsg
				? html`
						<div
							class="error-box"
							data-testid="forgot-success-msg"
							style="background:#efffef; border-color:#27ae60; color:#1a6b2f;"
						>
							${this.successMsg}
						</div>
					`
				: ''}
			${this.errorMsg ? html`<div class="error-box" data-testid="forgot-error-msg">${this.errorMsg}</div>` : ''}
		`;
	}

	private async requestQuestion(event: SubmitEvent) {
		event.preventDefault();
		this.errorMsg = '';
		this.successMsg = '';
		this.loading = true;
		try {
			const res = await this.http.post(`${BASE_API}/auth/request-password-reset`, { email: this.email });
			if (res.ok) {
				const json = await res.json();
				if (!json.question) {
					this.errorMsg = 'Das Konto konnte nicht gefunden oder nicht zurückgesetzt werden.';
					return;
				}
				this.question = json.question;
				this.step = 'answer';
			} else {
				this.errorMsg = 'Das Konto konnte nicht gefunden oder nicht zurückgesetzt werden.';
			}
		} catch {
			this.errorMsg = 'Server nicht erreichbar. Bitte versuche es später.';
		} finally {
			this.loading = false;
		}
	}

	private async verifyAnswer(event: SubmitEvent) {
		event.preventDefault();
		this.errorMsg = '';
		this.successMsg = '';
		this.loading = true;
		try {
			const res = await this.http.post(`${BASE_API}/auth/verify-security-answer`, {
				email: this.email,
				answer: this.answer
			});
			if (res.ok) {
				const json = await res.json();
				this.token = json.token;
				this.step = 'reset';
			} else {
				const json = await res.json().catch(() => null);
				this.errorMsg = json?.detail ?? neutralResetError;
			}
		} catch {
			this.errorMsg = 'Server nicht erreichbar. Bitte versuche es später.';
		} finally {
			this.loading = false;
		}
	}

	private async resetPassword(event: SubmitEvent) {
		event.preventDefault();
		this.errorMsg = '';
		this.successMsg = '';
		if (!this.token) {
			this.errorMsg = 'Das Passwort konnte nicht zurückgesetzt werden.';
			return;
		}
		this.loading = true;
		try {
			const res = await this.http.post(`${BASE_API}/auth/reset-password`, {
				token: this.token,
				newPassword: this.newPassword,
				repeatPassword: this.repeatPassword
			});
			if (res.ok) {
				this.successMsg = 'Dein Passwort wurde geändert. Du wirst zur Anmeldung weitergeleitet.';
				this.token = '';
				window.setTimeout(() => void this.router.push('/login'), 500);
			} else {
				const json = await res.json().catch(() => null);
				this.errorMsg = json?.detail ?? 'Das Passwort konnte nicht zurückgesetzt werden.';
			}
		} catch {
			this.errorMsg = 'Server nicht erreichbar. Bitte versuche es später.';
		} finally {
			this.loading = false;
		}
	}

	private goToLogin = () => {
		void this.router.push('/login');
	};
}

declare global {
	/** Describes custom elements provided by this module. */
	interface HTMLElementTagNameMap {
		'forgot-password': ForgotPasswordPage;
	}
}
