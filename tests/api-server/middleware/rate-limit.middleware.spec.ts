import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import { Request, Response } from 'express';
import { rateLimit } from '../../../api-server/src/middleware/rate-limit.middleware.js';

function createResponse() {
	const response = new EventEmitter() as Response & { body?: unknown };
	response.statusCode = 200;
	response.status = (code: number) => {
		response.statusCode = code;
		return response;
	};
	response.json = (body: unknown) => {
		response.body = body;
		return response;
	};
	return response;
}

describe('rateLimit middleware', () => {
	it('does not count successful requests when skipSuccessfulRequests is enabled', () => {
		const middleware = rateLimit({
			windowMs: 60_000,
			max: 2,
			keyPrefix: 'test-success',
			skipSuccessfulRequests: true
		});

		for (let i = 0; i < 5; i += 1) {
			const response = createResponse();
			let nextCalled = false;

			middleware({ ip: '127.0.0.1' } as Request, response, () => {
				nextCalled = true;
			});
			response.statusCode = 200;
			response.emit('finish');

			expect(nextCalled).to.equal(true);
			expect(response.statusCode).to.equal(200);
		}
	});

	it('still counts failed requests when skipSuccessfulRequests is enabled', () => {
		const middleware = rateLimit({
			windowMs: 60_000,
			max: 2,
			keyPrefix: 'test-failed',
			skipSuccessfulRequests: true
		});

		for (let i = 0; i < 2; i += 1) {
			const response = createResponse();
			middleware({ ip: '127.0.0.1' } as Request, response, () => {
				response.statusCode = 401;
			});
			response.emit('finish');
		}

		const limitedResponse = createResponse();
		let nextCalled = false;
		middleware({ ip: '127.0.0.1' } as Request, limitedResponse, () => {
			nextCalled = true;
		});

		expect(nextCalled).to.equal(false);
		expect(limitedResponse.statusCode).to.equal(429);
	});
});
