/**
 * Autor: Simon Josef Cebula

 */

import cors from 'cors';
import config from '../../config.json' with { type: 'json' };

const allowedOrigins = config.server.allowedOrigins;

export const corsMiddleware = cors({
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(null, false);
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Authorization', 'Content-Type'],
	maxAge: 86400
});
