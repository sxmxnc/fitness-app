/**
 * Autor: Simon Josef Cebula

 */

// Real HTTP security headers delivered WITH the SPA document by the Vite server (server.headers / preview.headers).
// The API-server Helmet only covers JSON responses; CSP and X-Frame-Options must sit on the document itself.

const contentSecurityPolicy = [
	`default-src 'self'`,
	`base-uri 'self'`,
	`object-src 'none'`,
	`frame-ancestors 'none'`,
	`img-src 'self' data:`,
	`script-src 'self'`,
	// Lit injects styles into the Shadow DOM, so 'unsafe-inline' is unavoidable; plus Google Fonts + Font Awesome
	`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com`,
	`font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com`,
	// 'self' covers the /api proxy and the same-origin HMR WebSocket; localhost is the dev fallback;
	// the VM origins cover the cross-origin API case in production (robust for both API models)
	`connect-src 'self' https://localhost:3000 http://localhost:3000`
].join('; ');

export const securityHeaders: Record<string, string> = {
	'Content-Security-Policy': contentSecurityPolicy,
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy':
		'geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()'
};
