/**
 * Autor: Luca Lammers

 */
const SQL_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Encodes html for safe output.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"'/]/g /**
		 * Provides the callback passed to value.replace.
		 * @param {string} char char.
		 * @returns {string} The operation result.
		 */,
		char => escapeHtmlChar(char)
	);
}

/**
 * Encodes html attribute for safe output.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function escapeHtmlAttribute(value: string): string {
	return escapeAsciiExceptAlphanumeric(
		value,
		/**
		 * Provides the callback passed to escapeAsciiExceptAlphanumeric.
		 * @param {number} charCode char code.
		 * @returns {string} The operation result.
		 */
		charCode => `&#x${charCode.toString(16).toUpperCase().padStart(2, '0')};`
	);
}

/**
 * Encodes java script string for safe output.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function escapeJavaScriptString(value: string): string {
	return escapeAsciiExceptAlphanumeric(
		value,
		/**
		 * Provides the callback passed to escapeAsciiExceptAlphanumeric.
		 * @param {number} charCode char code.
		 * @returns {string} The operation result.
		 */
		charCode => `\\x${charCode.toString(16).toUpperCase().padStart(2, '0')}`
	);
}

/**
 * Encodes css value for safe output.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function escapeCssValue(value: string): string {
	return escapeAsciiExceptAlphanumeric(
		value,
		/**
		 * Provides the callback passed to escapeAsciiExceptAlphanumeric.
		 * @param {number} charCode char code.
		 * @returns {string} The operation result.
		 */
		charCode => `\\${charCode.toString(16).toUpperCase().padStart(2, '0')} `
	);
}

/**
 * Encodes url parameter for safe output.
 * @param {string} value value.
 * @returns {string} The operation result.
 */
export function encodeUrlParameter(value: string): string {
	return escapeAsciiExceptAlphanumeric(
		value /**
		 * Provides the callback passed to escapeAsciiExceptAlphanumeric.
		 * @param {number} charCode char code.
		 * @returns {string} The operation result.
		 */,
		charCode => `%${charCode.toString(16).toUpperCase().padStart(2, '0')}`
	);
}

/**
 * Validates http url.
 * @param {string} value value.
 * @returns {string} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
export function validateHttpUrl(value: string): string {
	const url = new URL(value);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('URL protocol must be http or https');
	}

	return url.toString();
}

/**
 * Encodes sql identifier for safe output.
 * @param {string} identifier identifier.
 * @returns {string} The operation result.
 * @throws {Error} When validation fails or the operation cannot be completed.
 */
export function quoteSqlIdentifier(identifier: string): string {
	if (!SQL_IDENTIFIER_RE.test(identifier)) {
		throw new Error('Invalid SQL identifier');
	}

	return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Encodes ascii except alphanumeric for safe output.
 * @param {string} value value.
 * @param {(charCode: number) => string} encode encode.
 * @returns {string} The operation result.
 */
function escapeAsciiExceptAlphanumeric(value: string, encode: (charCode: number) => string): string {
	let escaped = '';
	for (const char of value) {
		const charCode = char.charCodeAt(0);
		if (charCode < 256 && !isAsciiAlphanumeric(charCode)) {
			escaped += encode(charCode);
			continue;
		}

		escaped += char;
	}

	return escaped;
}

/**
 * Checks whether is ascii alphanumeric is true.
 * @param {number} charCode char code.
 * @returns {boolean} The operation result.
 */
function isAsciiAlphanumeric(charCode: number): boolean {
	return (
		(charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)
	);
}

/**
 * Encodes html char for safe output.
 * @param {string} char char.
 * @returns {string} The operation result.
 */
function escapeHtmlChar(char: string): string {
	if (char.charCodeAt(0) === 39) {
		return '&#x27;';
	}

	switch (char) {
		case '&':
			return '&amp;';
		case '<':
			return '&lt;';
		case '>':
			return '&gt;';
		case '"':
			return '&quot;';
		case '/':
			return '&#x2F;';
		default:
			return char;
	}
}
