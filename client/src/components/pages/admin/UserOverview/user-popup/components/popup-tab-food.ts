/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, PropertyValues, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from '../../UserOverview.css?inline';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import type { UserStats } from './popup-tab-data';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

export interface FoodStats {
	avgCalories: number | null;
	avgProtein: number | null;
	avgFat: number | null;
	avgCarbs: number | null;
	trackedDays: number;
}

@customElement('popup-tab-food')
export class PopupTabFood extends LitElement {
	static readonly styles = [
		componentStyle,
		css`
			:host {
				flex: 1;
				height: auto;
				background: none;
				min-height: 0;
				overflow: hidden;
			}
		`
	];

	@property({ type: Object }) foodStats: FoodStats | null = null;
	@property({ type: Object }) user: UserStats | null = null;

	private macroChart: Chart | null = null;

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.macroChart?.destroy();
		this.macroChart = null;
	}

	override updated(changedProps: PropertyValues) {
		if (changedProps.has('foodStats')) {
			this.renderChart();
		}
	}

	render() {
		const s = this.foodStats;
		if (!s || s.trackedDays === 0) {
			return html`
				<div class="popup-empty" data-testid="food-tab-empty">
					<i class="fa-solid fa-utensils"></i>
					<span>Keine Foodtracking-Daten der letzten 30 Tage</span>
				</div>
			`;
		}

		const goal = this.user?.dailyCalorieGoal ?? null;
		const goalPct = goal && s.avgCalories != null ? Math.round((s.avgCalories / goal) * 100) : null;
		const fmt = (v: number | null, unit = '') => (v != null ? `${v}${unit}` : '—');

		return html`
			<div class="popup-overview" data-testid="food-tab-content">
				<div class="overview-stats">
					<div class="stat-card" data-testid="food-tab-stat-calories">
						<span class="stat-label">Ø Kalorien / Tag</span>
						<span class="stat-value">${fmt(s.avgCalories, ' kcal')}</span>
					</div>
					<div class="stat-card" data-testid="food-tab-stat-goal">
						<span class="stat-label">Zielerreichung</span>
						<span class="stat-value">${goalPct != null ? `${goalPct} %` : '—'}</span>
					</div>
					<div class="stat-card" data-testid="food-tab-stat-days">
						<span class="stat-label">Getrackte Tage (30 Tage)</span>
						<span class="stat-value">${s.trackedDays}</span>
					</div>
					<div class="stat-card" data-testid="food-tab-stat-protein">
						<span class="stat-label">Ø Protein / Tag</span>
						<span class="stat-value">${fmt(s.avgProtein, ' g')}</span>
					</div>
					<div class="stat-card" data-testid="food-tab-stat-fat">
						<span class="stat-label">Ø Fett / Tag</span>
						<span class="stat-value">${fmt(s.avgFat, ' g')}</span>
					</div>
					<div class="stat-card" data-testid="food-tab-stat-carbs">
						<span class="stat-label">Ø Kohlenhydrate / Tag</span>
						<span class="stat-value">${fmt(s.avgCarbs, ' g')}</span>
					</div>
				</div>

				<div class="charts-col">
					<div class="chart-section">
						<div class="chart-title">Makronährstoff-Verteilung (Ø / Tag)</div>
						<div class="chart-wrap"><canvas id="macro-chart"></canvas></div>
					</div>
				</div>
			</div>
		`;
	}

	private renderChart() {
		this.macroChart?.destroy();
		this.macroChart = null;

		const s = this.foodStats;
		if (!s || s.trackedDays === 0) return;

		// wait for canvas to be in the DOM before Chart.js tries to draw
		requestAnimationFrame(() => {
			const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>('#macro-chart');
			if (!canvas) return;
			this.macroChart = new Chart(canvas, {
				type: 'doughnut',
				data: {
					labels: ['Protein', 'Fett', 'Kohlenhydrate'],
					datasets: [
						{
							data: [s.avgProtein ?? 0, s.avgFat ?? 0, s.avgCarbs ?? 0],
							backgroundColor: ['#1d4ed8', '#60a5fa', '#bfdbfe'],
							hoverBackgroundColor: ['#1e40af', '#3b82f6', '#93c5fd'],
							borderWidth: 0,
							borderRadius: 6
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: '65%', // doughnut shape; 0% would be a pie
					layout: { padding: { bottom: 12 } },
					animation: { duration: 800, easing: 'easeOutQuart' },
					plugins: {
						legend: {
							position: 'bottom',
							labels: {
								font: { size: 12 },
								padding: 20,
								usePointStyle: true,
								pointStyle: 'circle'
							}
						},
						tooltip: {
							callbacks: {
								label: item => ` ${item.label}: ${item.raw as number} g`
							}
						}
					}
				}
			});
		});
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'popup-tab-food': PopupTabFood;
	}
}
