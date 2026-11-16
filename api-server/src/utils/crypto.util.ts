/**
 * Autor: Luca Lammers

 * Inspired by a Project of d.velop
 */
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 1;
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const ENCRYPTION_KEY_ENV = 'ENCRYPTION_KEY';

/** Describes the encrypted payload shape. */
type EncryptedPayload = {
	version: typeof VERSION;
	algorithm: typeof ALGORITHM;
	iv: string;
	ciphertext: string;
	authTag: string;
};

/**
 * Encrypts a plaintext value.
 * @param {string} plaintext plaintext.
 * @returns {string} The operation result.
 */
export function encrypt(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(IV_LENGTH_BYTES);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES });

	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();

	const payload: EncryptedPayload = {
		version: VERSION,
		algorithm: ALGORITHM,
		iv: iv.toString('base64'),
		ciphertext: ciphertext.toString('base64'),
		authTag: authTag.toString('base64')
	};

	return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

/**
 * Decrypts an encrypted payload.
 * @param {string} encryptedValue encrypted value.
 * @returns {string} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
export function decrypt(encryptedValue: string): string {
	const key = getEncryptionKey();
	const payload = parsePayload(encryptedValue);
	const iv = decodeBase64Field(payload.iv, 'iv');
	const ciphertext = decodeBase64Field(payload.ciphertext, 'ciphertext');
	const authTag = decodeBase64Field(payload.authTag, 'authTag');

	if (iv.length !== IV_LENGTH_BYTES) {
		throw new Error(`Invalid encrypted payload: iv must be ${IV_LENGTH_BYTES} bytes`);
	}

	if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
		throw new Error(`Invalid encrypted payload: authTag must be ${AUTH_TAG_LENGTH_BYTES} bytes`);
	}

	try {
		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES });
		decipher.setAuthTag(authTag);

		return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
	} catch {
		throw new Error('Unable to decrypt encrypted payload');
	}
}

/** Validates encryption key. */
export function validateEncryptionKey(): void {
	void getEncryptionKey();
}

/**
 * Retrieves encryption key.
 * @returns {Buffer} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
function getEncryptionKey(): Buffer {
	const encodedKey = process.env[ENCRYPTION_KEY_ENV];
	if (!encodedKey) {
		throw new Error(`${ENCRYPTION_KEY_ENV} environment variable is not set`);
	}

	const key = decodeBase64Field(encodedKey, ENCRYPTION_KEY_ENV);
	if (key.length !== KEY_LENGTH_BYTES) {
		throw new Error(`${ENCRYPTION_KEY_ENV} must be a base64-encoded ${KEY_LENGTH_BYTES}-byte key`);
	}

	return key;
}

/**
 * Parses payload.
 * @param {string} encryptedValue encrypted value.
 * @returns {EncryptedPayload} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
function parsePayload(encryptedValue: string): EncryptedPayload {
	try {
		const decoded = Buffer.from(encryptedValue, 'base64').toString('utf8');
		const payload = JSON.parse(decoded) as Partial<EncryptedPayload>;

		if (
			payload.version !== VERSION ||
			payload.algorithm !== ALGORITHM ||
			typeof payload.iv !== 'string' ||
			typeof payload.ciphertext !== 'string' ||
			typeof payload.authTag !== 'string'
		) {
			throw new Error('Invalid encrypted payload format');
		}

		return payload as EncryptedPayload;
	} catch {
		throw new Error('Invalid encrypted payload format');
	}
}

/**
 * Handles decode base64 field.
 * @param {string} value value.
 * @param {string} fieldName field name.
 * @returns {Buffer} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
function decodeBase64Field(value: string, fieldName: string): Buffer {
	if (!isCanonicalBase64(value)) {
		throw new Error(`${fieldName} must be base64 encoded`);
	}

	return Buffer.from(value, 'base64');
}

/**
 * Checks whether is canonical base64 is true.
 * @param {string} value value.
 * @returns {boolean} The operation result.
 */
function isCanonicalBase64(value: string): boolean {
	if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
		return false;
	}

	return Buffer.from(value, 'base64').toString('base64') === value;
}
