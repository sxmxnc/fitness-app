/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import componentStyle from './App-Overview.css?inline';

/** Defines landing preview. */
@customElement('landing-preview')
export class LandingPreview extends LitElement {
	static readonly styles = [componentStyle];

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<section class="section">
				<div class="section-inner">
					<div class="section-header">
						<h2>App-Vorschau</h2>
						<p>
							Ein Blick auf die übersichtliche, funktionale Benutzeroberfläche zur Erfassung von
							Mahlzeiten und Trainingseinheiten.
						</p>
					</div>

					<div class="preview-grid">
						<!-- Screen 1: Food Tracking -->
						<div class="app-screen">
							<div class="screen-bar">
								<div class="screen-dots"><span></span><span></span><span></span></div>
								<span class="screen-title">Ernährung</span>
							</div>

							<div class="screen-body">
								<div class="period-tabs">
									<button class="period-tab active" type="button">Täglich</button>
									<button class="period-tab" type="button">Wöchentl.</button>
									<button class="period-tab" type="button">Monatl.</button>
									<button class="period-tab" type="button">Jährlich</button>
								</div>

								<div class="food-summary-card">
									<div class="summary-label">HEUTE</div>
									<div class="summary-top-row">
										<div class="summary-main">
											<div class="calories-big">
												1.810
												<span class="calories-unit">kcal</span>
											</div>
											<div class="calorie-bar-wrap">
												<div class="bar-track">
													<div class="bar-fill bar-green" style="width:82%"></div>
												</div>
												<div class="bar-info">
													<span class="bar-text">1.810 / 2.200 kcal</span>
													<span class="bar-pct bar-green">82%</span>
												</div>
											</div>
										</div>
										<div class="summary-divider"></div>
										<div class="protein-block">
											<div class="protein-label">82g / 160g Protein</div>
											<div class="bar-track">
												<div class="bar-fill bar-orange" style="width:51%"></div>
											</div>
											<div class="bar-info">
												<span class="bar-pct bar-orange">51%</span>
											</div>
										</div>
									</div>
									<div class="macros-row">
										<div class="macro-item">
											<span class="macro-val">82g</span>
											<span class="macro-lbl">Eiweiß</span>
										</div>
										<div class="macro-item">
											<span class="macro-val">65g</span>
											<span class="macro-lbl">Fett</span>
										</div>
										<div class="macro-item">
											<span class="macro-val">215g</span>
											<span class="macro-lbl">Kohlenhydrate</span>
										</div>
									</div>
								</div>

								<div class="entry-list">
									<div class="entry-row">
										<div class="entry-icon">
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<circle cx="12" cy="12" r="5" />
												<line x1="12" y1="1" x2="12" y2="3" />
												<line x1="12" y1="21" x2="12" y2="23" />
												<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
												<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
												<line x1="1" y1="12" x2="3" y2="12" />
												<line x1="21" y1="12" x2="23" y2="12" />
												<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
												<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
											</svg>
										</div>
										<div class="entry-info">
											<span class="entry-name">Frühstück</span>
											<span class="entry-time">08:30</span>
										</div>
										<span class="entry-cal">310 kcal</span>
									</div>
									<div class="entry-row">
										<div class="entry-icon">
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M3 11l19-9-9 19-2-8-8-2z" />
											</svg>
										</div>
										<div class="entry-info">
											<span class="entry-name">Mittagessen</span>
											<span class="entry-time">12:15</span>
										</div>
										<span class="entry-cal">620 kcal</span>
									</div>
									<div class="entry-row">
										<div class="entry-icon">
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M18 8h1a4 4 0 0 1 0 8h-1" />
												<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
												<line x1="6" y1="1" x2="6" y2="4" />
												<line x1="10" y1="1" x2="10" y2="4" />
												<line x1="14" y1="1" x2="14" y2="4" />
											</svg>
										</div>
										<div class="entry-info">
											<span class="entry-name">Post-Workout Shake</span>
											<span class="entry-time">17:45</span>
										</div>
										<span class="entry-cal">280 kcal</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Screen 2: Workout Plans -->
						<div class="app-screen">
							<div class="screen-bar">
								<div class="screen-dots"><span></span><span></span><span></span></div>
								<span class="screen-title">Workout Pläne</span>
							</div>

							<div class="screen-body">
								<div class="workout-list-header">
									<button class="btn-new-plan" type="button">
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<line x1="12" y1="5" x2="12" y2="19" />
											<line x1="5" y1="12" x2="19" y2="12" />
										</svg>
										New Plan
									</button>
								</div>

								<div class="plan-list">
									<div class="plan-card">
										<div class="plan-card-body">
											<div class="drag-handle">
												<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
													<circle cx="7" cy="4" r="1.5" />
													<circle cx="7" cy="10" r="1.5" />
													<circle cx="7" cy="16" r="1.5" />
													<circle cx="13" cy="4" r="1.5" />
													<circle cx="13" cy="10" r="1.5" />
													<circle cx="13" cy="16" r="1.5" />
												</svg>
											</div>
											<div class="plan-info">
												<span class="plan-name">Push Day</span>
												<span class="plan-exercises">5 Übungen</span>
											</div>
											<div class="plan-actions">
												<button class="btn-start" type="button">Start</button>
											</div>
										</div>
									</div>

									<div class="plan-card">
										<div class="plan-card-body">
											<div class="drag-handle">
												<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
													<circle cx="7" cy="4" r="1.5" />
													<circle cx="7" cy="10" r="1.5" />
													<circle cx="7" cy="16" r="1.5" />
													<circle cx="13" cy="4" r="1.5" />
													<circle cx="13" cy="10" r="1.5" />
													<circle cx="13" cy="16" r="1.5" />
												</svg>
											</div>
											<div class="plan-info">
												<span class="plan-name">Oberkörper</span>
												<span class="plan-exercises">6 Übungen</span>
											</div>
											<div class="plan-actions">
												<span class="plan-badge">Classic</span>
												<button class="btn-start" type="button">Start</button>
											</div>
										</div>
									</div>

									<div class="plan-card">
										<div class="plan-card-body">
											<div class="drag-handle">
												<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
													<circle cx="7" cy="4" r="1.5" />
													<circle cx="7" cy="10" r="1.5" />
													<circle cx="7" cy="16" r="1.5" />
													<circle cx="13" cy="4" r="1.5" />
													<circle cx="13" cy="10" r="1.5" />
													<circle cx="13" cy="16" r="1.5" />
												</svg>
											</div>
											<div class="plan-info">
												<span class="plan-name">Full Body</span>
												<span class="plan-exercises">8 Übungen</span>
											</div>
											<div class="plan-actions">
												<button class="btn-start" type="button">Start</button>
											</div>
										</div>
									</div>
								</div>

								<div class="session-card">
									<div class="session-header">
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											width="15"
											height="15"
										>
											<path d="M6.5 6.5h11M6.5 11h11M6.5 15.5h5M3 5h.01M3 9.5h.01M3 14h.01" />
										</svg>
										<span>Aktive Session — Oberkörper</span>
									</div>
									<div class="session-exercises">
										<div class="session-ex done">
											<span class="ex-check">✓</span> Bank Drücken — 4×10
										</div>
										<div class="session-ex done">
											<span class="ex-check">✓</span> Latziehen — 3×12
										</div>
										<div class="session-ex current">
											<span class="ex-dot-active"></span> Überzüge — 4×10
										</div>
										<div class="session-ex"><span class="ex-dot-empty"></span> Dips — 3×12</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Screen 3: Dashboard -->
						<div class="app-screen">
							<div class="screen-bar">
								<div class="screen-dots"><span></span><span></span><span></span></div>
								<span class="screen-title">Dashboard</span>
							</div>

							<div class="screen-body">
								<div class="dash-card">
									<div class="dash-card-title">Kalorien diese Woche</div>
									<div class="bar-chart">
										<div class="bar-col">
											<div class="bar-col-fill" style="height:72%"></div>
											<span class="bar-day">Mo</span>
										</div>
										<div class="bar-col">
											<div class="bar-col-fill" style="height:88%"></div>
											<span class="bar-day">Di</span>
										</div>
										<div class="bar-col">
											<div class="bar-col-fill" style="height:61%"></div>
											<span class="bar-day">Mi</span>
										</div>
										<div class="bar-col">
											<div class="bar-col-fill highlight" style="height:82%"></div>
											<span class="bar-day">Do</span>
										</div>
										<div class="bar-col">
											<div class="bar-col-fill" style="height:55%"></div>
											<span class="bar-day">Fr</span>
										</div>
										<div class="bar-col">
											<div class="bar-col-fill muted" style="height:38%"></div>
											<span class="bar-day">Sa</span>
										</div>
										<div class="bar-col">
											<div class="bar-col-fill muted" style="height:20%"></div>
											<span class="bar-day">So</span>
										</div>
									</div>
								</div>

								<div class="stats-row">
									<div class="stat-card">
										<span class="stat-val">5</span>
										<span class="stat-lbl">Trainings</span>
									</div>
									<div class="stat-card accent">
										<span class="stat-val">5</span>
										<span class="stat-lbl">Streak</span>
									</div>
									<div class="stat-card">
										<span class="stat-val">82%</span>
										<span class="stat-lbl">Kalorienziel</span>
									</div>
								</div>

								<div class="dash-card heatmap-card">
									<div class="dash-card-title">Aktivitäts-Heatmap</div>
									<div class="mini-heatmap">
										<div class="heat-cell h3"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h0"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h0"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h0"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h0"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h0"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h3"></div>
										<div class="heat-cell h2"></div>
										<div class="heat-cell h1"></div>
										<div class="heat-cell h0"></div>
									</div>
									<div class="heatmap-legend">
										<span>Weniger</span>
										<div class="legend-cells">
											<div class="heat-cell h0"></div>
											<div class="heat-cell h1"></div>
											<div class="heat-cell h2"></div>
											<div class="heat-cell h3"></div>
										</div>
										<span>Mehr</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		`;
	}
}
