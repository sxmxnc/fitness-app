/**
 * Autor: Luca Lammers

 */
import { expect } from 'chai';
import crypto from 'node:crypto';
import { decrypt, encrypt, validateEncryptionKey } from '../../../api-server/src/utils/crypto.util.js';

const originalEncryptionKey = process.env.ENCRYPTION_KEY;

describe('crypto.util', () => {
	beforeEach(() => {
		process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
	});

	after(() => {
		if (originalEncryptionKey === undefined) {
			delete process.env.ENCRYPTION_KEY;
			return;
		}

		process.env.ENCRYPTION_KEY = originalEncryptionKey;
	});

	it('encrypts and decrypts plaintext with AES-256-GCM', () => {
		const plaintext = 'Sensitive profile data';
		const encrypted = encrypt(plaintext);

		expect(encrypted).to.not.equal(plaintext);
		expect(decrypt(encrypted)).to.equal(plaintext);
	});

	it('stores the algorithm metadata and public decryption parameters', () => {
		const encrypted = encrypt('metadata check');
		const payload = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8')) as {
			version: number;
			algorithm: string;
			iv: string;
			ciphertext: string;
			authTag: string;
		};

		expect(payload).to.include({ version: 1, algorithm: 'aes-256-gcm' });
		expect(Buffer.from(payload.iv, 'base64')).to.have.length(12);
		expect(Buffer.from(payload.authTag, 'base64')).to.have.length(16);
		expect(payload.ciphertext).to.be.a('string').and.not.empty;
	});

	it('uses a fresh nonce so equal plaintexts produce different ciphertexts', () => {
		const first = encrypt('same plaintext');
		const second = encrypt('same plaintext');

		expect(first).to.not.equal(second);
		expect(decrypt(first)).to.equal('same plaintext');
		expect(decrypt(second)).to.equal('same plaintext');
	});

	it('rejects manipulated ciphertexts', () => {
		const encrypted = encrypt('do not tamper');
		const payload = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8')) as {
			ciphertext: string;
		};

		const ciphertext = Buffer.from(payload.ciphertext, 'base64');
		ciphertext[0] = (ciphertext[0] ?? 0) ^ 1;
		payload.ciphertext = ciphertext.toString('base64');

		const tampered = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

		expect(() => decrypt(tampered)).to.throw('Unable to decrypt encrypted payload');
	});

	it('rejects manipulated auth tags', () => {
		const encrypted = encrypt('auth tag check');
		const payload = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8')) as {
			authTag: string;
		};

		const authTag = Buffer.from(payload.authTag, 'base64');
		authTag[0] = (authTag[0] ?? 0) ^ 1;
		payload.authTag = authTag.toString('base64');

		const tampered = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

		expect(() => decrypt(tampered)).to.throw('Unable to decrypt encrypted payload');
	});

	it('fails clearly when the encryption key is missing', () => {
		delete process.env.ENCRYPTION_KEY;

		expect(() => validateEncryptionKey()).to.throw('ENCRYPTION_KEY environment variable is not set');
	});

	it('fails clearly when the encryption key length is invalid', () => {
		process.env.ENCRYPTION_KEY = crypto.randomBytes(16).toString('base64');

		expect(() => validateEncryptionKey()).to.throw('ENCRYPTION_KEY must be a base64-encoded 32-byte key');
	});
});
