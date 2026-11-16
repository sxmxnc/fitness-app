/**
 * Autor: Luca Lammers

 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './login.css?inline';
import { BASE_API } from '../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../http-client.js';
import { Router, routerContext } from '../../../../../router.js';
import { LoginStep } from './login.types.js';
import './components/login-choose-step.js';
import './components/login-signup-email-step.js';
import './components/login-signup-details-step.js';
import './components/login-signup-security-step.js';
import './components/login-signin-step.js';

const fieldNames: Record<string, string> = {
	email: 'E-Mail-Adresse',
	firstName: 'Vorname',
	lastName: 'Nachname',
	password: 'Passwort',
	securityQuestionKey: 'Sicherheitsfrage',
	securityAnswer: 'Antwort',
	weight: 'Gewicht (kg)',
	height: 'Größe (cm)',
	birthDate: 'Geburtsdatum',
	dailyCalorieGoal: 'Kalorien-Ziel',
	dailyProteinGoal: 'Protein-Ziel',
	dailyFatGoal: 'Fett-Ziel',
	dailyCarbsGoal: 'Kohlenhydrat-Ziel'
};

const errorMessages: Record<string, string> = {
	'Invalid email address': 'Ungültige E-Mail-Adresse',
	'Password must be at least 8 characters': 'Muss mindestens 8 Zeichen lang sein',
	'Password must contain at least 1 uppercase letter': 'Muss mindestens einen Großbuchstaben enthalten',
	'Password must contain at least 2 numbers': 'Muss mindestens 2 Zahlen enthalten',
	'Password must contain at least 1 special character': 'Muss mindestens ein Sonderzeichen enthalten',
	'birthDate cannot be in the future': 'Darf nicht in der Zukunft liegen'
};

/**
 * Translates a backend validation detail into a user-facing German message.
 * @param {string} detail Backend error detail.
 * @returns {string} The translated error text.
 */
function translateError(detail: string): string {
	const colonIdx = detail.indexOf(': ');
	if (colonIdx !== -1) {
		const field = detail.substring(0, colonIdx);
		const msg = detail.substring(colonIdx + 2);
		const fieldDe = fieldNames[field] ?? field;
		const msgDe = translateMessage(msg);
		return `${fieldDe}: ${msgDe}`;
	}
	return errorMessages[detail] ?? detail;
}

/**
 * Translates a backend validation message into German when a known mapping exists.
 * @param {string} msg Backend validation message.
 * @returns {string} The translated message text.
 */
function translateMessage(msg: string): string {
	if (errorMessages[msg]) return errorMessages[msg];

	const tooSmallMatch = msg.match(/Too small: expected number to be >=(\d+)/);
	if (tooSmallMatch) return `Muss mindestens ${tooSmallMatch[1]} sein`;

	const tooBigMatch = msg.match(/Too big: expected number to be <=(\d+)/);
	if (tooBigMatch) return `Darf maximal ${tooBigMatch[1]} sein`;

	if (msg.match(/Too small: expected string to have >=\d+ character/)) return 'Darf nicht leer sein';
	return msg;
}

/** Defines the login page shell and coordinates the login flow steps. */
@customElement('app-login')
export class LoginPage extends LitElement {
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

	@state() private step: LoginStep = 'choose';
	@state() private email = '';
	@state() private errorMsg = '';
	@state() private loading = false;
	@state() private successMsg = '';
	@state() private signinPassword = '';
	@state() private signupPassword = '';
	private signupDetails: Record<string, unknown> | null = null;

	/** Initializes component state after the element is connected. */
	override connectedCallback() {
		super.connectedCallback();
		const params = new URLSearchParams(window.location.search);
		const error = params.get('error');
		if (error) {
			this.errorMsg = error;
			this.step = 'signin';
		}
	}

	/**
	 * Renders the login page shell and the active step component.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	override render() {
		return html`
			<div class="page" data-testid="login-page">
				<div
					class="card"
					data-testid="login-card"
					@step-change=${this.onStepChange}
					@email-change=${this.onEmailChange}
					@signup-password-change=${this.onSignupPasswordChange}
					@signin-password-change=${this.onSigninPasswordChange}
					@signup-email-submit=${this.checkEmail}
					@signup-submit=${this.submitSignup}
					@signup-security-submit=${this.submitSignupSecurity}
					@signin-submit=${this.submitSignin}
				>
					<div class="card-logo">
						<img src="/favicon.png" alt="Logo" width="24" height="24" />
						Food &amp; Workout Tracker
					</div>
					${this.renderStep()}
				</div>
			</div>
		`;
	}

	/**
	 * Renders the active login step component.
	 * @returns {TemplateResult<1>} The active step template.
	 */
	private renderStep() {
		switch (this.step) {
			case 'signup-email':
				return html`
					<login-signup-email-step
						.email=${this.email}
						.errorMsg=${this.errorMsg}
						.loading=${this.loading}
					></login-signup-email-step>
				`;
			case 'signup-details':
				return html`
					<login-signup-details-step
						.errorMsg=${this.errorMsg}
						.loading=${this.loading}
						.signupPassword=${this.signupPassword}
					></login-signup-details-step>
				`;
			case 'signup-security':
				return html`
					<login-signup-security-step
						.errorMsg=${this.errorMsg}
						.loading=${this.loading}
					></login-signup-security-step>
				`;
			case 'signin':
				return html`
					<login-signin-step
						.email=${this.email}
						.errorMsg=${this.errorMsg}
						.successMsg=${this.successMsg}
						.signinPassword=${this.signinPassword}
						.loading=${this.loading}
					></login-signin-step>
				`;
			case 'choose':
			default:
				return html`<login-choose-step></login-choose-step>`;
		}
	}

	/**
	 * Stores the email emitted by a step component and clears stale errors.
	 * @param {CustomEvent<string>} event Email change event.
	 */
	private onEmailChange(event: CustomEvent<string>) {
		this.email = event.detail;
		this.errorMsg = '';
	}

	/**
	 * Stores the signup password emitted by the details step.
	 * @param {CustomEvent<string>} event Signup password change event.
	 */
	private onSignupPasswordChange(event: CustomEvent<string>) {
		this.signupPassword = event.detail;
	}

	/**
	 * Stores the sign-in password emitted by the sign-in step.
	 * @param {CustomEvent<string>} event Sign-in password change event.
	 */
	private onSigninPasswordChange(event: CustomEvent<string>) {
		this.signinPassword = event.detail;
	}

	/**
	 * Handles step changes emitted by child step components.
	 * @param {CustomEvent<LoginStep>} event Step change event.
	 */
	private onStepChange(event: CustomEvent<LoginStep>) {
		this.goTo(event.detail);
	}

	/**
	 * Redirects the user after a successful login based on the JWT role.
	 * @param {string} token JWT returned by the API.
	 * @returns {Promise<void>} A promise resolving after navigation completes.
	 */
	private async redirectAfterLogin(token: string): Promise<void> {
		const base64url = token.split('.')[1];
		const base64 = base64url
			.replace(/-/g, '+')
			.replace(/_/g, '/')
			.padEnd(Math.ceil(base64url.length / 4) * 4, '=');
		const payload = JSON.parse(atob(base64));
		localStorage.setItem('userId', payload.id);
		await this.router.push(payload.role === 'admin' ? '/admin/overview' : '/profile');
	}

	/** Checks whether the entered email can continue to the signup details step. */
	private async checkEmail() {
		this.errorMsg = '';
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(this.email)) {
			this.errorMsg = 'Bitte gib eine gültige E-Mail-Adresse ein.';
			return;
		}
		this.loading = true;
		try {
			const res = await this.http.post(`${BASE_API}/users/validateEmail`, { email: this.email });

			if (res.ok) {
				this.goTo('signup-details');
			} else {
				this.errorMsg = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
			}
		} catch {
			this.errorMsg = 'Server nicht erreichbar. Bitte versuche es später.';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Submits the signup form emitted by the signup details step.
	 * @param {CustomEvent<HTMLFormElement>} event Signup submit event.
	 */
	private submitSignup(event: CustomEvent<HTMLFormElement>): void {
		this.errorMsg = '';

		const data = new FormData(event.detail);
		const birthDateValue = data.get('birthDate') as string;
		const birthDateTimestamp = new Date(birthDateValue).getTime();

		this.signupDetails = {
			email: this.email,
			firstName: data.get('firstName') as string,
			lastName: data.get('lastName') as string,
			role: 'user' as const,
			password: data.get('password') as string,
			weight: Number(data.get('weight')),
			height: Number(data.get('height')),
			birthDate: birthDateTimestamp,
			dailyCalorieGoal: Number(data.get('dailyCalorieGoal')),
			dailyProteinGoal: Number(data.get('dailyProteinGoal')),
			dailyFatGoal: Number(data.get('dailyFatGoal')),
			dailyCarbsGoal: Number(data.get('dailyCarbsGoal'))
		};

		this.goTo('signup-security');
	}

	/**
	 * Submits the security question step and creates the account.
	 * @param {CustomEvent<HTMLFormElement>} event Security form submit event.
	 * @returns {Promise<void>} A promise resolving after the signup attempt completes.
	 */
	private async submitSignupSecurity(event: CustomEvent<HTMLFormElement>): Promise<void> {
		this.errorMsg = '';
		if (!this.signupDetails) {
			this.errorMsg = 'Bitte vervollständige zuerst dein Profil.';
			this.goTo('signup-details');
			return;
		}
		this.loading = true;

		const data = new FormData(event.detail);
		const body = {
			...this.signupDetails,
			securityQuestionKey: data.get('securityQuestionKey') as string,
			securityAnswer: data.get('securityAnswer') as string
		};

		try {
			const res = await this.http.post(`${BASE_API}/users`, body);

			if (res.ok) {
				const { token } = await res.json();
				localStorage.setItem('token', token);
				this.signupDetails = null;
				await this.redirectAfterLogin(token);
			} else if (res.status === 409) {
				this.errorMsg = 'Diese E-Mail-Adresse ist bereits registriert.';
			} else {
				const json = await res.json();
				this.errorMsg = json?.detail ? translateError(json.detail) : 'Ein Fehler ist aufgetreten.';
			}
		} catch {
			this.errorMsg = 'Server nicht erreichbar. Bitte versuche es später.';
		} finally {
			this.loading = false;
		}
	}

	/** Submits the current sign-in credentials. */
	private async submitSignin() {
		this.errorMsg = '';
		this.loading = true;
		try {
			const res = await this.http.post(`${BASE_API}/auth/login`, {
				email: this.email,
				password: this.signinPassword
			});

			if (res.ok) {
				const { token } = await res.json();
				localStorage.setItem('token', token);
				await this.redirectAfterLogin(token);
			} else if (res.status === 401) {
				this.errorMsg = 'E-Mail-Adresse oder Passwort ist nicht korrekt.';
			} else {
				this.errorMsg = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
			}
		} catch {
			this.errorMsg = 'Server nicht erreichbar. Bitte versuche es später.';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Switches to the requested login flow step and clears step-local state.
	 * @param {LoginStep} step Target step.
	 */
	private goTo(step: LoginStep) {
		this.step = step;
		this.errorMsg = '';
		this.signinPassword = '';
		if (step !== 'signup-details') this.signupPassword = '';
		if (step === 'choose' || step === 'signup-email' || step === 'signin') this.signupDetails = null;
	}
}

declare global {
	/** Describes the custom elements provided by this module. */
	interface HTMLElementTagNameMap {
		'app-login': LoginPage;
	}
}
