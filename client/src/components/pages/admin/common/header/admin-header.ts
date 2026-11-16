/**
 * Autor: Luca Lammers

 */
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './admin-header.css?inline';
import './admin-logout-button.js';

/** Defines the header Lit component. */
@customElement('admin-header')
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
			<div class="page-header">
				<div class="page-title">${icon ? html`<i class="fa-solid ${icon}"></i>` : ''} ${label}</div>
				<admin-logout-button></admin-logout-button>
			</div>
		`;
	}

	/**
	 * Loads title.
	 * @returns {{ icon: string; label: string }} The operation result.
	 */
	private getTitle(): { icon: string; label: string } {
		switch (globalThis.location.pathname) {
			case '/admin/profiles':
				return { icon: 'fa-users', label: 'Profilübersicht' };
			case '/admin/workouts':
				return { icon: 'fa-dumbbell', label: 'Workoutübersicht' };
			case '/admin/foodtracking':
				return { icon: 'fa-utensils', label: 'Foodtracker Übersicht' };
			case '/admin/overview':
				return { icon: 'fa-gauge-high', label: 'Allgemeines' };
			default:
				return { icon: '', label: '' };
		}
	}
}
