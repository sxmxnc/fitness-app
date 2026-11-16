/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './Hero.css?inline';

/** Defines the landing hero Lit component. */
@customElement('landing-hero')
export class LandingHero extends LitElement {
	static styles = [componentStyle];

	override connectedCallback() {
		super.connectedCallback();
		this.textContent = 'Food Workout Tracker';
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<section class="hero" data-testid="hero-section">
				<h1 class="hero-text">Food &amp; Workout Tracker</h1>
				<h3 class="hero-text">
					Verfolge deine Ernährung und dein Training an einem Ort. Plane Mahlzeiten, protokolliere deine
					Trainingseinheiten und gewinne Einblicke.<br />
					alles über eine übersichtliche, moderne Benutzeroberfläche.
				</h3>
				<div class="hero-btns">
					<a href="/login"
						><button class="btn btn-login" data-testid="hero-start-btn">
							Jetzt starten <i class="fa-solid fa-dumbbell"></i></button
					></a>
					<a href="https://github.com/sxmxnc/fitness-app"
						><button class="btn btn-explore" data-testid="hero-project-btn">
							Projekt ansehen
							<i class="fa-brands fa-github" aria-hidden="true"></i></button
					></a>
				</div>
			</section>
		`;
	}
}
