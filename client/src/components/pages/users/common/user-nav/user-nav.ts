/**
 * Autor: Luca Lammers

 * Autor: Simon Josef Cebula

 */
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './user-nav.css?inline';

/** Defines the app nav Lit component. */
@customElement('app-nav')
export class AppNav extends LitElement {
	static readonly styles = [componentStyle];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<nav class="bottom-nav" data-testid="user-nav">
				<a class="${this.isActive('/workouts')}" data-testid="user-nav-workouts-link" href="/workouts">
					<i class="fa-solid fa-dumbbell"></i>
					Workouts
				</a>
				<a class="${this.isActive('/stats')}" data-testid="user-nav-stats-link" href="/stats">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="20" x2="18" y2="10" />
						<line x1="12" y1="20" x2="12" y2="4" />
						<line x1="6" y1="20" x2="6" y2="14" />
					</svg>
					Statistiken
				</a>
				<a class="${this.isActive('/foodtracking')}" data-testid="user-nav-food-link" href="/foodtracking">
					<i class="fa-solid fa-utensils"></i>
					Ernährung
				</a>
				<a class="${this.isActive('/profile')}" data-testid="user-nav-profile-link" href="/profile">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
					Profil
				</a>
			</nav>
		`;
	}

	/**
	 * Handles is active.
	 * @param {string} path path.
	 * @returns {string} The formatted string.
	 */
	private isActive(path: string): string {
		// prefix match so nested routes stay active
		return globalThis.location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item';
	}
}
