/**
 * Autor: Luca Lammers

 */
import { expect } from 'chai';
import crypto from 'node:crypto';
import { signPayload, signValue, validateHmacKey, verifyPayload, verifySignedValue } from '../../../api-server/src/utils/mac.util.js';

const originalHmacKey = process.env.HMAC_KEY;

describe('mac.util', () => {
	beforeEach(() => {
		process.env.HMAC_KEY = crypto.randomBytes(32).toString('base64');
	});

	after(() => {
		if (originalHmacKey === undefined) {
			delete process.env.HMAC_KEY;
			return;
		}

		process.env.HMAC_KEY = originalHmacKey;
	});

	it('signs and verifies a string value with HMAC-SHA-256', () => {
		const signedValue = signValue('userId=123');

		expect(signedValue).to.match(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
		expect(verifySignedValue(signedValue)).to.equal('userId=123');
	});

	it('rejects a manipulated payload', () => {
		const signedValue = signValue('role=user');
		const [version, payload, mac] = signedValue.split('.');
		const manipulatedPayload = Buffer.from('role=admin', 'utf8').toString('base64url');

		expect(verifySignedValue(`${version}.${manipulatedPayload}.${mac}`)).to.equal(null);
		expect(verifySignedValue(`${version}.${payload}.${mac}`)).to.equal('role=user');
	});

	it('rejects a manipulated MAC', () => {
		const signedValue = signValue('download=invoice');
		const [version, payload, mac] = signedValue.split('.');
		const macBytes = Buffer.from(mac ?? '', 'base64url');
		macBytes[0] = (macBytes[0] ?? 0) ^ 1;

		expect(verifySignedValue(`${version}.${payload}.${macBytes.toString('base64url')}`)).to.equal(null);
	});

	it('rejects invalid token formats without throwing', () => {
		expect(verifySignedValue('')).to.equal(null);
		expect(verifySignedValue('v2.payload.mac')).to.equal(null);
		expect(verifySignedValue('v1.not base64.mac')).to.equal(null);
	});

	it('uses deterministic JSON serialization for structured payloads', () => {
		const first = signPayload({ userId: '123', role: 'user' });
		const second = signPayload({ role: 'user', userId: '123' });

		expect(first).to.equal(second);
		expect(verifyPayload(first)).to.deep.equal({ role: 'user', userId: '123' });
	});

	it('rejects a structured token signed with a different key', () => {
		const signedValue = signPayload({ action: 'reset-password', userId: '123' });
		process.env.HMAC_KEY = crypto.randomBytes(32).toString('base64');

		expect(verifyPayload(signedValue)).to.equal(null);
	});

	it('fails clearly when the HMAC key is missing', () => {
		delete process.env.HMAC_KEY;

		expect(() => validateHmacKey()).to.throw('HMAC_KEY environment variable is not set');
	});

	it('fails clearly when the HMAC key is too short', () => {
		process.env.HMAC_KEY = crypto.randomBytes(16).toString('base64');

		expect(() => validateHmacKey()).to.throw('HMAC_KEY must be at least 32 bytes');
	});
});
