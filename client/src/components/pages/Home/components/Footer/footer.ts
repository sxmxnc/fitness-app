/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './footer.css?inline';

/** Defines the landing footer Lit component. */
@customElement('landing-footer')
export class LandingFooter extends LitElement {
	static readonly styles = [componentStyle];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<footer class="footer">
				<div class="footer-inner">
					<div class="footer-brand">
						<div class="footer-name">
							<img src="/favicon.png" alt="Logo" width="24" height="24" />
							Essen &amp; Training Tracker
						</div>
						<p>
							Dein persönlicher Begleiter für Ernährung und Training: einfach, übersichtlich und
							motivierend.
						</p>
					</div>
					<div class="footer-links">
						<a href="https://github.com/sxmxnc/fitness-app">
							<i class="fa-brands fa-github"></i> GitHub
						</a>
						<a href="/login"> <i class="fa-solid fa-right-to-bracket"></i> Anmelden </a>
					</div>
				</div>
				<div class="footer-copy">© 2026 Team 07 - Luca Lammers, Justus Heinz &amp; Simon Cebula</div>
			</footer>
		`;
	}
}
