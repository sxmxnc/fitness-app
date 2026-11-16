/**
 * Autor: Luca Lammers

 */
import crypto from 'node:crypto';

const VERSION = 'v1';
const HMAC_HASH = 'sha256';
const HMAC_KEY_ENV = 'HMAC_KEY';
const MIN_KEY_LENGTH_BYTES = 32;

/**
 * Signs value.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function signValue(value: string): string {
	return signSerializedPayload(value);
}

/**
 * Verifies signed value.
 * @param {string} signedValue signed value.
 * @returns {string | null} The operation result.
 */
export function verifySignedValue(signedValue: string): string | null {
	return verifySerializedPayload(signedValue);
}

/**
 * Signs payload.
 * @param {Record<string, unknown>} payload payload.
 * @returns {string} The operation result.
 */
export function signPayload(payload: Record<string, unknown>): string {
	return signSerializedPayload(stableStringify(payload));
}

/**
 * Creates a deterministic keyed lookup hash for values that are stored encrypted
 * but still need equality searches, such as email addresses.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function createLookupHash(value: string): string {
	return base64UrlEncode(createMac(`lookup.${value}`));
}

/**
 * Verifies payload.
 * @param {string} signedValue signed value.
 * @returns {Record<string, unknown> | null} The operation result.
 */
export function verifyPayload(signedValue: string): Record<string, unknown> | null {
	const payload = verifySerializedPayload(signedValue);
	if (payload === null) {
		return null;
	}

	try {
		const parsed = JSON.parse(payload) as unknown;
		return isRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/** Validates hmac key. */
export function validateHmacKey(): void {
	void getHmacKey();
}

/**
 * Signs serialized payload.
 * @param {string} serializedPayload serialized payload.
 * @returns {string} The operation result.
 */
function signSerializedPayload(serializedPayload: string): string {
	const payload = base64UrlEncode(Buffer.from(serializedPayload, 'utf8'));
	const macInput = `${VERSION}.${payload}`;
	const mac = createMac(macInput);

	return `${macInput}.${base64UrlEncode(mac)}`;
}

/**
 * Verifies serialized payload.
 * @param {string} signedValue signed value.
 * @returns {string | null} The operation result.
 */
function verifySerializedPayload(signedValue: string): string | null {
	const parts = signedValue.split('.');
	if (parts.length !== 3 || parts[0] !== VERSION) {
		return null;
	}

	const [version, payload, mac] = parts;
	if (!payload || !mac || !isBase64Url(payload) || !isBase64Url(mac)) {
		return null;
	}

	const expectedMac = createMac(`${version}.${payload}`);
	const receivedMac = base64UrlDecode(mac);
	if (!timingSafeEqual(expectedMac, receivedMac)) {
		return null;
	}

	return base64UrlDecode(payload).toString('utf8');
}

/**
 * Creates mac.
 * @param {string} value value.
 * @returns {Buffer} The operation result.
 */
function createMac(value: string): Buffer {
	return crypto.createHmac(HMAC_HASH, getHmacKey()).update(value, 'utf8').digest();
}

/**
 * Retrieves hmac key.
 * @returns {Buffer} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
function getHmacKey(): Buffer {
	const encodedKey = process.env[HMAC_KEY_ENV];
	if (!encodedKey) {
		throw new Error(`${HMAC_KEY_ENV} environment variable is not set`);
	}

	if (!isBase64(encodedKey)) {
		throw new Error(`${HMAC_KEY_ENV} must be base64 encoded`);
	}

	const key = Buffer.from(encodedKey, 'base64');
	if (key.length < MIN_KEY_LENGTH_BYTES) {
		throw new Error(`${HMAC_KEY_ENV} must be at least ${MIN_KEY_LENGTH_BYTES} bytes`);
	}

	return key;
}

/**
 * Handles timing safe equal.
 * @param {Buffer} expected expected.
 * @param {Buffer} received received.
 * @returns {boolean} The operation result.
 */
function timingSafeEqual(expected: Buffer, received: Buffer): boolean {
	if (expected.length !== received.length) {
		return false;
	}

	return crypto.timingSafeEqual(expected, received);
}

/**
 * Handles stable stringify.
 * @param {unknown} value value.
 * @returns {string} The operation result.
 */
function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		return `[${value
			.map(
				/**
				 * Transforms one item while building the derived collection.
				 * @param {any} item item.
				 * @returns {string} The operation result.
				 */
				item => stableStringify(item)
			)
			.join(',')}]`;
	}

	const record = value as Record<string, unknown>;
	const entries = Object.keys(record)
		.sort()
		.map(
			/**
			 * Transforms one item while building the derived collection.
			 * @param {string} key key.
			 * @returns {string} The operation result.
			 */
			key => `${JSON.stringify(key)}:${stableStringify(record[key])}`
		);

	return `{${entries.join(',')}}`;
}

/**
 * Checks whether is record is true.
 * @param {unknown} value value.
 * @returns {value is Record<string, unknown>} The operation result.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Handles base64 url encode.
 * @param {Buffer} value value.
 * @returns {string} The operation result.
 */
function base64UrlEncode(value: Buffer): string {
	return value.toString('base64url');
}

/**
 * Handles base64 url decode.
 * @param {string} value value.
 * @returns {Buffer} The operation result.
 */
function base64UrlDecode(value: string): Buffer {
	return Buffer.from(value, 'base64url');
}

/**
 * Checks whether is base64 is true.
 * @param {string} value value.
 * @returns {boolean} The operation result.
 */
function isBase64(value: string): boolean {
	if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
		return false;
	}

	return Buffer.from(value, 'base64').toString('base64') === value;
}

/**
 * Checks whether is base64 url is true.
 * @param {string} value value.
 * @returns {boolean} The operation result.
 */
function isBase64Url(value: string): boolean {
	return /^[A-Za-z0-9_-]+$/.test(value);
}
