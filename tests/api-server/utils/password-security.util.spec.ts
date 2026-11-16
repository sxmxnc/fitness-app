/**
 * Autor: Luca Lammers

 */
import { expect } from 'chai';
import {
	createPasswordResetToken,
	hashPassword,
	hashResetToken,
	validatePasswordPolicy,
	verifyPassword
} from '../../../api-server/src/utils/password-security.util.js';

describe('password-security.util', () => {
	it('accepts a long varied passphrase', () => {
		const result = validatePasswordPolicy('Sonne-Kaffee-Wald-42!');

		expect(result.valid).to.equal(true);
		expect(result.errors).to.deep.equal([]);
		expect(result.score).to.be.greaterThan(2);
	});

	it('rejects passwords shorter than the configured minimum', () => {
		const result = validatePasswordPolicy('Ab1!');

		expect(result.valid).to.equal(false);
		expect(result.errors).to.include('Das Passwort ist zu kurz.');
	});

	it('rejects common passwords and normalized leetspeak variants', () => {
		const result = validatePasswordPolicy('!!P4$$w0ord');

		expect(result.valid).to.equal(false);
		expect(result.errors).to.include('Das Passwort ist zu häufig verwendet.');
	});

	it('rejects obvious sequences and keyboard patterns', () => {
		const result = validatePasswordPolicy('Qwertz123456!');

		expect(result.valid).to.equal(false);
		expect(result.errors).to.include('Das Passwort darf keine leicht erratbaren Muster enthalten.');
	});

	it('rejects passwords containing email or name parts', () => {
		const result = validatePasswordPolicy('MaxMuster42!', {
			email: 'max@example.test',
			firstName: 'Max',
			lastName: 'Muster'
		});

		expect(result.valid).to.equal(false);
		expect(result.errors).to.include('Das Passwort darf keine leicht erratbaren Muster enthalten.');
	});

	it('hashes passwords with bcrypt salts and verifies only the matching password', async function () {
		this.timeout(10000);

		const password = 'Sonne-Kaffee-Wald-42!';
		const firstHash = await hashPassword(password);
		const secondHash = await hashPassword(password);

		expect(firstHash).to.match(/^\$2[aby]\$/);
		expect(secondHash).to.match(/^\$2[aby]\$/);
		expect(firstHash).to.not.equal(secondHash);
		expect(await verifyPassword(password, firstHash)).to.equal(true);
		expect(await verifyPassword('Wrong-Passphrase-42!', firstHash)).to.equal(false);
	});

	it('creates random reset tokens and stores only deterministic token hashes', () => {
		const first = createPasswordResetToken();
		const second = createPasswordResetToken();

		expect(first.token).to.not.equal(second.token);
		expect(first.tokenHash).to.equal(hashResetToken(first.token));
		expect(first.tokenHash).to.not.equal(first.token);
		expect(first.tokenHash).to.have.length(64);
	});
});
