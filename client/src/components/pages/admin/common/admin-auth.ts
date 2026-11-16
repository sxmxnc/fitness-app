/**
 * Autor: Luca Lammers

 */
import { BASE_API } from '../../../../config.js';
import type { HttpClient } from '../../../../http-client.js';

const UNAUTHORIZED_MSG =
	'Sie sind nicht authorisiert diesen Bereich zu sehen. Nutzen Sie einen Admin Login um sich die Daten anzusehen.';

/**
 * Checks that the current user is authenticated and has the admin role.
 * Redirects to /login with an error message if not.
 * Returns true if authorized, false if redirecting.
 */
export async function requireAdminAuth(http: HttpClient): Promise<boolean> {
	const token = localStorage.getItem('token');

	if (!token) {
		redirectToLogin();
		return false;
	}

	try {
		const base64url = token.split('.')[1];
		const base64 = base64url.replaceAll('-', '+').replaceAll('_', '/');
		const payload = JSON.parse(atob(base64));
		if (payload.role !== 'admin') {
			redirectToLogin();
			return false;
		}
	} catch {
		redirectToLogin();
		return false;
	}

	try {
		const res = await http.get(`${BASE_API}/auth/verify`);
		if (!res.ok) {
			localStorage.removeItem('token');
			redirectToLogin();
			return false;
		}
	} catch {
		redirectToLogin();
		return false;
	}

	return true;
}

/** Handles redirect to login. */
function redirectToLogin(): void {
	globalThis.location.href = `/login?error=${encodeURIComponent(UNAUTHORIZED_MSG)}`;
}
