/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import { createContext } from '@lit/context';

export class HttpClient {
	async get(url: string): Promise<Response> {
		return fetch(url, { headers: this.authHeaders() });
	}

	async post(url: string, body?: unknown): Promise<Response> {
		return fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
	}

	async patch(url: string, body?: unknown): Promise<Response> {
		return fetch(url, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
	}

	async put(url: string, body?: unknown): Promise<Response> {
		return fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
	}

	async delete(url: string): Promise<Response> {
		return fetch(url, { method: 'DELETE', headers: this.authHeaders() });
	}

	private authHeaders(): Record<string, string> {
		const token = localStorage.getItem('token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}
}

export const httpClientContext = createContext<HttpClient>('httpClient');
