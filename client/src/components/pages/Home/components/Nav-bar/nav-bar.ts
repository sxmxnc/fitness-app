/**
 * Autor: Luca Lammers

 */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './nav-bar.css?inline';

/** Defines the landing navbar Lit component. */
@customElement('landing-navbar')
export class LandingNavbar extends LitElement {
	static styles = [
		componentStyle,
		css`
			:host {
				display: block;
			}
		`
	];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<header class="navbar">
				<div class="navbar-title">
					<img src="/favicon.png" alt="Logo" width="28" height="28" />
					WebEngineering Team 07
				</div>
				<nav class="navbar-links">
					<a
						href="#features"
						@click=${
							/**
							 * Handles the inline callback for the surrounding UI operation.
							 * @param {Event} e DOM event emitted by the UI.
							 */
							(e: Event) => this.scrollToSection(e, 'features')
						}
					>
						<i class="fa-solid fa-star"></i> Funktionen
					</a>
					<a
						href="#preview"
						@click=${
							/**
							 * Handles the inline callback for the surrounding UI operation.
							 * @param {Event} e DOM event emitted by the UI.
							 */
							(e: Event) => this.scrollToSection(e, 'preview')
						}
					>
						<i class="fa-solid fa-eye"></i> Vorschau
					</a>
					<a
						href="#footer"
						@click=${
							/**
							 * Handles the inline callback for the surrounding UI operation.
							 * @param {Event} e DOM event emitted by the UI.
							 */
							(e: Event) => this.scrollToSection(e, 'footer')
						}
					>
						<i class="fa-solid fa-envelope"></i> Kontakt
					</a>
				</nav>
				<a href="/login" class="btn start-btn"> Jetzt starten <i class="fa-solid fa-arrow-right"></i> </a>
			</header>
		`;
	}

	/**
	 * Handles scroll to section.
	 * @param {Event} e DOM event emitted by the UI.
	 * @param {string} id id.
	 */
	private scrollToSection(e: Event, id: string) {
		e.preventDefault();
		const appHome = (this.getRootNode() as ShadowRoot).host;
		const target = appHome.shadowRoot?.querySelector(`#${id}`);
		target?.scrollIntoView({ behavior: 'smooth' });
	}
}
