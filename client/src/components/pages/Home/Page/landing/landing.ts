/**
 * Autor: Luca Lammers

 */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './landing.css?inline';
import '../../components/Nav-bar/nav-bar.js';
import '../../components/Hero/Hero.js';
import '../../components/Features/features.js';
import '../../components/Overview/App-Overview.js';
import '../../components/Footer/footer.js';

/** Defines the home page Lit component. */
@customElement('app-home')
export class HomePage extends LitElement {
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
			<landing-navbar></landing-navbar>
			<landing-hero id="hero"></landing-hero>
			<landing-features id="features"></landing-features>
			<landing-preview id="preview"></landing-preview>
			<landing-footer id="footer"></landing-footer>
		`;
	}
}
