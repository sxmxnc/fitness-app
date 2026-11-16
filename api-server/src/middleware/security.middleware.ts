/**
 * Autor: Simon Josef Cebula

 */

import helmet from 'helmet';

export const securityMiddleware = helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: [`'self'`],
			scriptSrc: [`'self'`],
			styleSrc: [`'self'`, `'unsafe-inline'`], // Lit needs unsafe-inline for Shadow DOM style injection
			imgSrc: [`'self'`, 'data:'],
			connectSrc: [`'self'`],
			fontSrc: [`'self'`],
			objectSrc: [`'none'`],
			mediaSrc: [`'self'`],
			frameSrc: [`'none'`],
			frameAncestors: [`'none'`]
		}
	},
	hsts: {
		maxAge: 31536000,
		includeSubDomains: true,
		preload: true
	},
	referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
	frameguard: { action: 'deny' },
	noSniff: true,
	crossOriginEmbedderPolicy: false // disabled — breaks CDN font loading
});
