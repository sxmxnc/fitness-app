/**
 * Autor: Luca Lammers

 */

/**
 * Information what this is https://datatracker.ietf.org/doc/html/rfc9457
 */
export class RfcError extends Error {
	status: number;
	title: string;
	detail: string;

	/**
	 * Creates a new rfc error instance.
	 * @param {number} status status.
	 * @param {string} title title.
	 * @param {string} detail detail.
	 */
	constructor(status: number, title: string, detail: string) {
		super(detail);
		this.status = status;
		this.title = title;
		this.detail = detail;
	}
	/**
	 * Handles to json.
	 * @returns {{ status: number; title: string; detail: string; }} The operation result.
	 */
	toJSON() {
		return {
			status: this.status,
			title: this.title,
			detail: this.detail
		};
	}
}

export const rfcErros = {
	/**
	 * Handles bad request.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	badRequest: (detail: string) => new RfcError(400, 'Bad Request', detail),
	/**
	 * Handles unauthorized.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	unauthorized: (detail: string) => new RfcError(401, 'Unauthorized', detail),
	/**
	 * Handles forbidden.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	forbidden: (detail: string) => new RfcError(403, 'Forbidden', detail),
	/**
	 * Handles not found.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	notFound: (detail: string) => new RfcError(404, 'Not Found', detail),
	/**
	 * Handles conflict.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	conflict: (detail: string) => new RfcError(409, 'Conflict', detail),
	/**
	 * Handles gone.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	gone: (detail: string) => new RfcError(410, 'Gone', detail),
	/**
	 * Handles too many requests.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	tooManyRequests: (detail: string) => new RfcError(429, 'Too Many Requests', detail),
	/**
	 * Handles internal server error.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	internalServerError: (detail: string) => new RfcError(500, 'Internal Server Error', detail),
	/**
	 * Handles bad gateway.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	badGateway: (detail: string) => new RfcError(502, 'Bad Gateway', detail),
	/**
	 * Handles service unavailable.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	serviceUnavailable: (detail: string) => new RfcError(503, 'Service Unavailable', detail),
	/**
	 * Handles gateway timeout.
	 * @param {string} detail detail.
	 * @returns {RfcError} The operation result.
	 */
	gatewayTimeout: (detail: string) => new RfcError(504, 'Gateway Timeout', detail)
};
