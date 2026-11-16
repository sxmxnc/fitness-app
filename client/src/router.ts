/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import { createContext } from '@lit/context';

import { Router as LitRouter } from '@lit-labs/router';

export const routerContext = createContext<Router>('router');

export class Router extends LitRouter {
	async push(relURL: string) {
		await this.goto(relURL);
		window.history.pushState({}, '', relURL);
	}

	back() {
		if (window.history.length > 1) {
			window.history.back();
		}
	}
}
