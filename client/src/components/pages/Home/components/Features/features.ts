/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './features.css?inline';

const features = [
	{
		icon: 'fa-utensils',
		title: 'Ernährungstracking',
		text: 'Erfasse deine Mahlzeiten mit detaillierten Angaben zu Kalorien und Makronährstoffen. Suche nach Lebensmitteln, speichere Favoriten und verfolge mühelos deine tägliche Nahrungsaufnahme.'
	},
	{
		icon: 'fa-dumbbell',
		title: 'Trainingsplanung',
		text: 'Erstelle  individuelle Trainingspläne oder wählen Sie aus den vom System bereitgestellten Plänen aus. Verfolge Sätze, Wiederholungen und deine Fortschritte im Laufe der Zeit.'
	},
	{
		icon: 'fa-arrow-trend-up',
		title: 'Tracking & Fortschrittsübersichten',
		text: 'Erhalte eine übersichtliche tägliche und wöchentliche Auswertungen zu Ihrer Ernährung und Ihrem Training. Dank anschaulicher Grafiken lässt sich dein Fortschritt intuitiv verfolgen.'
	},
	{
		icon: 'fa-chart-gantt',
		title: 'Admin-Dashboard',
		text: 'Eine Übersicht von Nutzungsdaten der User zur erstellung von Übersicheten und analysen'
	}
];

/** Defines landing features. */
@customElement('landing-features')
export class LandingFeatures extends LitElement {
	static styles = [componentStyle];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<section class="section">
				<div class="section-inner">
					<div class="section-header">
						<h2>Alles was du brauchst</h2>
						<p>
							Eine umfassende Plattform, die speziell auf die zentralen Anforderungen der Ernährungs- und
							Fitness-Tracking-Funktionen zugeschnitten ist.
						</p>
					</div>
					<div class="features-block">
						${features.map(
							/**
							 * Transforms one item for the rendered or derived collection.
							 * @param {{ icon: string; title: string; text: string; }} f f.
							 * @returns {TemplateResult<1>} The Lit template to render.
							 */
							f => html`
								<div class="feature-card">
									<div class="feature-card-icon">
										<i class="fa-solid ${f.icon}" aria-hidden="true"></i>
									</div>
									<h3>${f.title}</h3>
									<p>${f.text}</p>
								</div>
							`
						)}
					</div>
				</div>
			</section>
		`;
	}
}
