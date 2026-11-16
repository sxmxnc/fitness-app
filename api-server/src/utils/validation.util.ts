/**
 * Autor: Luca Lammers

 */
import { z } from 'zod';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Handles validation detail.
 * @param {z.ZodError} error error.
 * @returns {string} The operation result.
 */
export function validationDetail(error: z.ZodError): string {
	const issue = error.issues[0];
	if (!issue) {
		return 'Invalid request input';
	}

	const field = issue.path[0]?.toString();
	return field ? `${field}: ${issue.message}` : issue.message;
}

/**
 * Normalizes text into its canonical form.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function canonicalizeText(value: string): string {
	return safeDecodeURIComponent(value).normalize('NFC').trim();
}

export const uuidV4Schema = z.preprocess(canonicalizeScalar, z.string().regex(UUID_V4_RE, 'must be a valid UUID v4'));

export const nonEmptyTextSchema =
	/**
	 * Handles non empty text schema.
	 * @param {number} maxLength max length.
	 * @returns {ZodPipe<ZodTransform<unknown, unknown>, ZodString>} The operation result.
	 */
	(maxLength = 255) => z.preprocess(canonicalizeScalar, z.string().min(1).max(maxLength));

export const optionalTextSchema =
	/**
	 * Handles optional text schema.
	 * @param {number} maxLength max length.
	 * @returns {ZodPipe<ZodTransform<unknown, unknown>, ZodOptional<ZodString>>} The operation result.
	 */
	(maxLength = 1000) => z.preprocess(canonicalizeOptionalScalar, z.string().max(maxLength).optional());

export const positiveIntSchema =
	/**
	 * Handles positive int schema.
	 * @param {number} max max.
	 * @returns {ZodPipe<ZodTransform<unknown, unknown>, ZodNumber>} The operation result.
	 */
	(max = 10_000) => z.preprocess(canonicalizeNumber, z.number().int().min(1).max(max));

export const optionalPositiveIntSchema =
	/**
	 * Handles optional positive int schema.
	 * @param {number} max max.
	 * @returns {ZodPipe<ZodTransform<unknown, unknown>, ZodOptional<ZodNumber>>} The operation result.
	 */
	(max = 10_000) => z.preprocess(canonicalizeOptionalNumber, z.number().int().min(1).max(max).optional());

export const optionalNonNegativeNumberSchema =
	/**
	 * Handles optional non negative number schema.
	 * @param {number} max max.
	 * @returns {ZodPipe<ZodTransform<unknown, unknown>, ZodOptional<ZodNumber>>} The operation result.
	 */
	(max = 1_000_000) => z.preprocess(canonicalizeOptionalNumber, z.number().min(0).max(max).optional());

export const timestampQuerySchema = z.preprocess(canonicalizeOptionalNumber, z.number().int().min(0).optional());

export const dateOnlySchema = z.preprocess(
	canonicalizeScalar,
	z
		.string()
		.regex(DATE_ONLY_RE, 'must be in format YYYY-MM-DD')
		.refine(isValidDateOnly, 'must be a valid calendar date')
);

export const optionalDateOnlySchema = z.preprocess(
	canonicalizeOptionalScalar,
	z
		.string()
		.regex(DATE_ONLY_RE, 'must be in format YYYY-MM-DD')
		.refine(isValidDateOnly, 'must be a valid calendar date')
		.optional()
);

export const yearSchema = z.preprocess(canonicalizeNumber, z.number().int().min(1970).max(3000));
export const isoWeekSchema = z.preprocess(canonicalizeNumber, z.number().int().min(1).max(53));
export const monthSchema = z.preprocess(canonicalizeNumber, z.number().int().min(1).max(12));

/**
 * Normalizes scalar into its canonical form.
 * @param {unknown} value value.
 * @returns {unknown} The operation result.
 */
function canonicalizeScalar(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}

	return canonicalizeText(value);
}

/**
 * Normalizes optional scalar into its canonical form.
 * @param {unknown} value value.
 * @returns {unknown} The operation result.
 */
function canonicalizeOptionalScalar(value: unknown): unknown {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	return canonicalizeScalar(value);
}

/**
 * Normalizes number into its canonical form.
 * @param {unknown} value value.
 * @returns {unknown} The operation result.
 */
function canonicalizeNumber(value: unknown): unknown {
	const canonical = canonicalizeScalar(value);
	if (typeof canonical === 'number') {
		return canonical;
	}

	if (typeof canonical !== 'string' || canonical.length === 0) {
		return canonical;
	}

	return Number(canonical);
}

/**
 * Normalizes optional number into its canonical form.
 * @param {unknown} value value.
 * @returns {unknown} The operation result.
 */
function canonicalizeOptionalNumber(value: unknown): unknown {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	return canonicalizeNumber(value);
}

/**
 * Handles safe decode uricomponent.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
function safeDecodeURIComponent(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/**
 * Checks whether is valid date only is true.
 * @param {string} value value.
 * @returns {boolean} The operation result.
 */
function isValidDateOnly(value: string): boolean {
	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
