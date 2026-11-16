/**
 * Autor: Luca Lammers

 */
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './admin-nav.css?inline';

/** Defines the app nav Lit component. */
@customElement('admin-nav')
export class AppNav extends LitElement {
	static readonly styles = [componentStyle];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<nav class="bottom-nav" data-testid="admin-nav">
				<a
					class="${this.isActive('/admin/overview')}"
					data-testid="admin-nav-overview-link"
					href="/admin/overview"
				>
					<i class="fa-solid fa-gauge-high"></i>
					<span>Allgemeines</span>
				</a>
				<a
					class="${this.isActive('/admin/profiles')}"
					data-testid="admin-nav-profiles-link"
					href="/admin/profiles"
				>
					<i class="fa-solid fa-users"></i>
					<span>Profile</span>
				</a>
				<a
					class="${this.isActive('/admin/workouts')}"
					data-testid="admin-nav-workouts-link"
					href="/admin/workouts"
				>
					<i class="fa-solid fa-dumbbell"></i>
					<span>Workouts</span>
				</a>
				<a
					class="${this.isActive('/admin/foodtracking')}"
					data-testid="admin-nav-foodtracker-link"
					href="/admin/foodtracking"
				>
					<i class="fa-solid fa-utensils"></i>
					<span>Foodtracker</span>
				</a>
			</nav>
		`;
	}

	/**
	 * Checks if the nav Item should be active or not
	 * @param path URL of the link
	 * @returns string css class if is active
	 */
	private isActive(path: string): string {
		return globalThis.location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item';
	}
}
