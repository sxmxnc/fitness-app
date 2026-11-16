/**
 * Autor: Luca Lammers

 */
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './admin-logout-button.css?inline';
import { BASE_API } from '../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../http-client.js';

/** Defines admin logout button. */
@customElement('admin-logout-button')
export class AdminLogoutButton extends LitElement {
	static readonly styles = [componentStyle];

	@consume({ context: httpClientContext }) private readonly http: HttpClient = new HttpClient();

	@state() private loggingOut = false;

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<button
				class="admin-logout-button"
				data-testid="admin-logout-btn"
				@click=${this.logout}
				?disabled=${this.loggingOut}
			>
				<i class="fa-solid fa-right-from-bracket"></i>
				${this.loggingOut ? 'Abmelden...' : 'Abmelden'}
			</button>
		`;
	}

	/** Handles logout. */
	private async logout() {
		if (this.loggingOut) return;

		this.loggingOut = true;
		try {
			await this.http.post(`${BASE_API}/auth/logout`);
		} catch {
			// Logout should still clear the local session if the server is unavailable.
		}

		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		globalThis.location.href = '/';
	}
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'admin-logout-button': AdminLogoutButton;
	}
}
