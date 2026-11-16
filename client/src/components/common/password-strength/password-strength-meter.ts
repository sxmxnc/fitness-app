/**
 * Autor: Luca Lammers

 */
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './password-strength-meter.css?inline';

/** Describes the password strength label shape. */
export type PasswordStrengthLabel = 'sehr schwach' | 'schwach' | 'mittel' | 'stark' | 'sehr stark';

/** Describes the password strength result shape. */
export type PasswordStrengthResult = {
	score: number;
	label: PasswordStrengthLabel;
	passedRules: string[];
	failedRules: string[];
	warnings: string[];
	meetsMinimumPolicy: boolean;
};

const commonPasswords = new Set([
	'password',
	'passwort',
	'123456',
	'123456789',
	'qwertz',
	'qwerty',
	'admin',
	'letmein',
	'welcome',
	'iloveyou',
	'!!p4$$w0ord',
	'p4ssw0rd'
]);

const labels: PasswordStrengthLabel[] = ['sehr schwach', 'schwach', 'mittel', 'stark', 'sehr stark'];

/**
 * Handles evaluate password strength.
 * @param {string} password password.
 * @param {number} minLength min length.
 * @returns {PasswordStrengthResult} The operation result.
 */
export function evaluatePasswordStrength(password: string, minLength = 12): PasswordStrengthResult {
	const normalized = password.normalize('NFC');
	const lower = normalized.toLowerCase();
	const leetNormalized = lower.replace(/[@4]/g, 'a').replace(/[!1|]/g, 'i').replace(/0/g, 'o').replace(/\$/g, 's');

	const rules = [
		{ label: `Mindestens ${minLength} Zeichen`, passed: normalized.length >= minLength },
		{ label: 'Kleinbuchstaben enthalten', passed: /[a-z]/.test(normalized) },
		{ label: 'Großbuchstaben enthalten', passed: /[A-ZÄÖÜ]/.test(normalized) },
		{ label: 'Mindestens zwei Ziffern enthalten', passed: (normalized.match(/\d/g) ?? []).length >= 2 },
		{ label: 'Sonderzeichen enthalten', passed: /[^a-zA-Z0-9ÄÖÜäöüß]/.test(normalized) },
		{ label: 'Kein offensichtliches Muster', passed: !hasObviousPattern(lower, leetNormalized) },
		{ label: 'Nicht in der lokalen Liste häufiger Passwörter', passed: !isCommonPassword(lower, leetNormalized) }
	];

	const passedRules = rules
		.filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {{ label: string; passed: boolean; }} rule rule.
			 * @returns {boolean} True when the condition is met.
			 */
			rule => rule.passed
		)
		.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {{ label: string; passed: boolean; }} rule rule.
			 * @returns {string} The formatted string.
			 */
			rule => rule.label
		);
	const failedRules = rules
		.filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {{ label: string; passed: boolean; }} rule rule.
			 * @returns {boolean} True when the condition is met.
			 */
			rule => !rule.passed
		)
		.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {{ label: string; passed: boolean; }} rule rule.
			 * @returns {string} The formatted string.
			 */
			rule => rule.label
		);
	const warnings: string[] = [];

	if (normalized.length > 0 && normalized.length < minLength) {
		warnings.push('Verwende lieber eine längere Passphrase.');
	}
	if (isCommonPassword(lower, leetNormalized)) {
		warnings.push('Dieses Passwort ist zu häufig oder zu leicht erratbar.');
	}
	if (hasObviousPattern(lower, leetNormalized)) {
		warnings.push('Vermeide bekannte Wörter, Namen, Wiederholungen und Tastaturmuster.');
	}
	warnings.push('Kombiniere mehrere zufällige Wörter. Die finale Prüfung erfolgt serverseitig.');

	const varietyScore = rules.filter(
		/**
		 * Selects items that should remain in the derived collection.
		 * @param {{ label: string; passed: boolean; }} rule rule.
		 * @returns {boolean} True when the condition is met.
		 */
		rule => rule.passed
	).length;
	const lengthBonus = normalized.length >= 16 ? 1 : 0;
	const penalty = warnings.length > 1 ? 1 : 0;
	const baseScore =
		normalized.length === 0 ? 0 : Math.max(0, Math.min(4, Math.floor((varietyScore + lengthBonus - penalty) / 2)));
	const score =
		isCommonPassword(lower, leetNormalized) || hasObviousPattern(lower, leetNormalized)
			? Math.min(baseScore, 1)
			: baseScore;

	return {
		score,
		label: labels[score],
		passedRules,
		failedRules,
		warnings,
		meetsMinimumPolicy: failedRules.length === 0
	};
}

/** Defines password strength meter. */
@customElement('password-strength-meter')
export class PasswordStrengthMeter extends LitElement {
	static readonly styles = [componentStyle];

	@property({ type: String }) password = '';
	@property({ type: Number, attribute: 'min-length' }) minLength = 12;
	@property({ type: String }) confirmation = '';
	@property({ type: Boolean, attribute: 'show-confirmation' }) showConfirmation = false;

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		const result = evaluatePasswordStrength(this.password, this.minLength);
		const confirmationTouched = this.showConfirmation && this.confirmation.length > 0;
		const confirmationMatches = this.password.length > 0 && this.password === this.confirmation;

		return html`
			<section class="meter" aria-live="polite" data-testid="password-strength-meter">
				<div class="meter-head">
					<span>Passwortstärke</span>
					<strong data-testid="password-strength-label">${result.label}</strong>
				</div>
				<div class="bar" aria-hidden="true">
					<span class="bar-fill score-${result.score}"></span>
				</div>
				<ul class="rules" data-testid="password-strength-rules">
					${result.passedRules.map(
						/**
						 * Transforms one item for the rendered or derived collection.
						 * @param {string} rule rule.
						 * @returns {TemplateResult<1>} The Lit template to render.
						 */
						rule => html`<li class="passed">✓ ${rule}</li>`
					)}
					${result.failedRules.map(
						/**
						 * Transforms one item for the rendered or derived collection.
						 * @param {string} rule rule.
						 * @returns {TemplateResult<1>} The Lit template to render.
						 */
						rule => html`<li class="failed">○ ${rule}</li>`
					)}
				</ul>
				${this.showConfirmation
					? html`
							<p
								class=${confirmationTouched && !confirmationMatches
									? 'confirmation failed'
									: 'confirmation'}
								data-testid="password-confirmation-status"
							>
								${confirmationTouched
									? confirmationMatches
										? 'Die Passwort-Wiederholung stimmt überein.'
										: 'Die Passwort-Wiederholung stimmt noch nicht überein.'
									: 'Wiederhole das Passwort zur Bestätigung.'}
							</p>
						`
					: ''}
				<ul class="hints">
					${result.warnings.map(
						/**
						 * Transforms one item for the rendered or derived collection.
						 * @param {string} warning warning.
						 * @returns {TemplateResult<1>} The Lit template to render.
						 */
						warning => html`<li>${warning}</li>`
					)}
					<li>Das Passwort darf nicht auf Common-Password-Listen vorkommen.</li>
				</ul>
			</section>
		`;
	}
}

/**
 * Handles is common password.
 * @param {string} lower lower.
 * @param {string} leetNormalized leet normalized.
 * @returns {boolean} True when the condition is met.
 */
function isCommonPassword(lower: string, leetNormalized: string): boolean {
	return commonPasswords.has(lower) || commonPasswords.has(leetNormalized);
}

/**
 * Handles has obvious pattern.
 * @param {string} lower lower.
 * @param {string} leetNormalized leet normalized.
 * @returns {boolean} True when the condition is met.
 */
function hasObviousPattern(lower: string, leetNormalized: string): boolean {
	return (
		/(.)\1{4,}/.test(lower) ||
		/(?:abc|abcd|1234|123456|qwerty|qwertz|password|passwort)/.test(leetNormalized) ||
		/(?:19|20)\d{2}/.test(lower)
	);
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'password-strength-meter': PasswordStrengthMeter;
	}
}
