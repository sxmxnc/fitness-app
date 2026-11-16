/**
 * Autor: Luca Lammers

 * Inspired by some of d.velops rate Limiter
 */
import { Request, RequestHandler } from 'express';
import { rfcErros } from '../errors/rfc-error.js';

/** Describes the rate limit options shape. */
type RateLimitOptions = {
	windowMs: number;
	max: number;
	keyPrefix: string;
	key?: (req: Request) => string;
	skipSuccessfulRequests?: boolean;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Handles rate limit.
 * @param {RateLimitOptions} options options.
 * @returns {RequestHandler} The operation result.
 */
export function rateLimit(options: RateLimitOptions): RequestHandler {
	return (
		/**
		 * Applies the configured in-memory rate limit to one Express request.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req Express request.
		 * @param {Response<any, Record<string, any>, number>} res Express response.
		 * @param {NextFunction} next Express next callback.
		 */
		(req, res, next) => {
			const now = Date.now();
			const baseKey = options.key?.(req) ?? req.ip ?? 'unknown';
			const key = `${options.keyPrefix}:${baseKey}`;
			const bucket = buckets.get(key);
			const refundSuccessfulRequest =
				/** Refunds the bucket counter when the request completes successfully. */
				() => {
					if (!options.skipSuccessfulRequests) return;
					res.on(
						'finish',
						/** Updates the bucket after the response has been sent. */
						() => {
							if (res.statusCode < 400) {
								const currentBucket = buckets.get(key);
								if (currentBucket) {
									currentBucket.count = Math.max(0, currentBucket.count - 1);
								}
							}
						}
					);
				};

			if (!bucket || bucket.resetAt <= now) {
				buckets.set(key, { count: 1, resetAt: now + options.windowMs });
				refundSuccessfulRequest();
				next();
				return;
			}

			if (bucket.count >= options.max) {
				res.status(429).json(
					rfcErros.tooManyRequests('Zu viele Versuche. Bitte später erneut versuchen.').toJSON()
				);
				return;
			}

			bucket.count += 1;
			refundSuccessfulRequest();
			next();
		}
	);
}
