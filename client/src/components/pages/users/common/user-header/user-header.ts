/**
 * Autor: Luca Lammers

 * Autor: Simon Josef Cebula

 */
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './user-header.css?inline';

/** Defines the header Lit component. */
@customElement('app-header')
export class Header extends LitElement {
	static readonly styles = [componentStyle];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		const { icon, label } = this.getTitle();
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<div class="page-header">${icon ? html`<i class="fa-solid ${icon}"></i>` : ''} ${label}</div>
		`;
	}

	/**
	 * Loads title.
	 * @returns {{ icon: string; label: string }} The operation result.
	 */
	private getTitle(): { icon: string; label: string } {
		switch (globalThis.location.pathname) {
			case '/profile':
				return { icon: 'fa-user', label: 'Profil' };
			case '/workouts':
				return { icon: 'fa-person-running', label: 'Workouts' };
			case '/foodtracking':
				return { icon: 'fa-utensils', label: 'Foodtracker' };
			case '/stats':
				return { icon: 'fa-chart-line', label: 'Statistiken' };
			default:
				return { icon: '', label: '' };
		}
	}
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'app-header': Header;
	}
}
