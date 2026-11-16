/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import { defineConfig } from 'vite';
import postcssPresetEnv from 'postcss-preset-env';
import viteLitCssPlugin from './vite-lit-css-plugin.js';
import fs from 'node:fs';
import { securityHeaders } from './security-headers.js';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
	build: { target: 'esnext' },
	plugins: [viteLitCssPlugin()],
	server: {
		port: 8080,
		host: true,
		allowedHosts: ['docker'],
		headers: securityHeaders,
		proxy: {
			'/api': {
				target: apiProxyTarget,
				changeOrigin: true,
				secure: false
			}
		},
		https: fs.existsSync('/certificates/server.key.pem')
			? {
					key: fs.readFileSync('/certificates/server.key.pem'),
					cert: fs.readFileSync('/certificates/server.cert.pem')
				}
			: undefined
	},
	preview: { headers: securityHeaders },
	css: {
		postcss: {
			plugins: [postcssPresetEnv({ stage: 2 })]
		}
	}
});
