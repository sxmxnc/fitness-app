/**
 * Autor: Luca Lammers

 */
import { fixture, html } from '@open-wc/testing-helpers';
import { expect } from 'chai';
import {
	evaluatePasswordStrength,
	type PasswordStrengthMeter
} from '../../../client/src/components/common/password-strength/password-strength-meter.js';

describe('PasswordStrengthMeter', () => {
	it('detects common passwords and obvious leetspeak patterns', () => {
		const result = evaluatePasswordStrength('!!P4$$w0ord');

		expect(result.score).to.be.lessThan(2);
		expect(result.failedRules).to.include('Nicht in der lokalen Liste häufiger Passwörter');
		expect(result.warnings.join(' ')).to.include('zu häufig');
	});

	it('rates long varied passphrases higher', () => {
		const result = evaluatePasswordStrength('Sonne-Kaffee-Wald-42!');

		expect(result.score).to.be.greaterThan(2);
		expect(result.label).to.be.oneOf(['stark', 'sehr stark']);
		expect(result.passedRules).to.include('Mindestens 12 Zeichen');
	});

	it('renders rules and live confirmation feedback', async () => {
		const el = await fixture<PasswordStrengthMeter>(
			html`<password-strength-meter
				password="Sonne-Kaffee-Wald-42!"
				confirmation="Sonne-Kaffee-Wald-42!"
				show-confirmation
			></password-strength-meter>`
		);

		expect(el.shadowRoot!.querySelector('[data-testid="password-strength-label"]')?.textContent).to.match(
			/stark|sehr stark/
		);
		expect(el.shadowRoot!.querySelector('[data-testid="password-confirmation-status"]')?.textContent).to.include(
			'stimmt überein'
		);
	});
});
