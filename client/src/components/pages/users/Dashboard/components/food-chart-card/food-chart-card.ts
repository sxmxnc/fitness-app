/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import {
	Chart,
	LineController,
	LineElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Filler,
	Tooltip
} from 'chart.js';
import componentStyle from './food-chart-card.css?inline';
import { BASE_API } from '../../../../../../config.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

type Period = 'weekly' | 'monthly';

type BreakdownDay = {
	date: number;
	calories: number;
	protein: number;
	fat: number;
	carbs: number;
};

type SummaryResponse = {
	breakdown: BreakdownDay[];
};

type ChartStats = {
	avgCal: number;
	avgProt: number;
	calGoalDays: number | null;
	protGoalDays: number | null;
	days: number;
};

@customElement('my-food-chart-card')
export class FoodChartCardComponent extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@query('#calories-canvas') private readonly caloriesCanvas!: HTMLCanvasElement;
	@query('#protein-canvas') private readonly proteinCanvas!: HTMLCanvasElement;

	@state() private period: Period = 'weekly';
	@state() private breakdown: BreakdownDay[] = [];
	@state() private calorieGoal: number | null = null;
	@state() private proteinGoal: number | null = null;
	@state() private loading = true;

	private caloriesChart: Chart | null = null;
	private proteinChart: Chart | null = null;

	private get userId(): string {
		return localStorage.getItem('userId') ?? '';
	}

	override connectedCallback() {
		super.connectedCallback();
		this.textContent = 'Protein';
		void this.loadData();
	}

	override updated(changed: PropertyValues) {
		super.updated(changed);
		if (!this.loading && (changed.has('breakdown') || changed.has('loading'))) {
			this.initCharts();
		}
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.caloriesChart?.destroy();
		this.proteinChart?.destroy();
	}

	render() {
		return html`
			<div class="chart-card">
				<div class="card-header">
					<h2 class="card-title">Ernährung</h2>
					${this.renderPeriodTabs()}
				</div>
				${this.loading ? html`<div class="loading-state">Daten werden geladen…</div>` : this.renderCharts()}
			</div>
		`;
	}

	private async loadData() {
		this.loading = true;
		const id = this.userId;
		const date = Date.now();
		const summaryUrl = `${BASE_API}/food/${id}/summary?period=${this.period}&date=${date}`;

		try {
			const [summaryRes, userRes] = await Promise.all([
				this.http.get(summaryUrl),
				this.http.get(`${BASE_API}/users/data/${id}`)
			]);

			if (summaryRes.ok) {
				const data: SummaryResponse = await summaryRes.json();
				this.breakdown = data.breakdown ?? [];
			}

			if (userRes.ok) {
				const userData = (await userRes.json()) as {
					dailyCalorieGoal?: number;
					dailyProteinGoal?: number;
				};
				this.calorieGoal = userData.dailyCalorieGoal ?? null;
				this.proteinGoal = userData.dailyProteinGoal ?? null;
			}
		} catch {
			// network error — leave breakdown empty, charts will show empty state
		} finally {
			this.loading = false;
		}
	}

	private initCharts() {
		if (!this.caloriesCanvas || !this.proteinCanvas) return;

		const labels = this.breakdown.map(d =>
			new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
		);
		const caloriesData = this.breakdown.map(d => d.calories);
		const proteinData = this.breakdown.map(d => d.protein);

		this.caloriesChart?.destroy();
		this.caloriesChart = new Chart(this.caloriesCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: caloriesData,
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59,130,246,0.1)',
						fill: true,
						tension: 0.3,
						pointRadius: this.breakdown.length > 14 ? 2 : 4, // smaller dots for dense datasets (>2 weeks)
						pointHoverRadius: 5
					}
				]
			},
			options: this.chartOptions('kcal')
		});

		this.proteinChart?.destroy();
		this.proteinChart = new Chart(this.proteinCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: proteinData,
						borderColor: '#22c55e',
						backgroundColor: 'rgba(34,197,94,0.1)',
						fill: true,
						tension: 0.3,
						pointRadius: this.breakdown.length > 14 ? 2 : 4, // same density rule as calories chart
						pointHoverRadius: 5
					}
				]
			},
			options: this.chartOptions('g')
		});
	}

	private chartOptions(unit: string): Chart['options'] {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: ctx => `${ctx.parsed.y} ${unit}`
					}
				}
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: {
						font: { size: 10, family: `'Space Grotesk', 'Sora', sans-serif` },
						maxTicksLimit: 7,
						maxRotation: 0
					}
				},
				y: {
					beginAtZero: true,
					grid: { color: '#f3f4f6' },
					ticks: {
						font: { size: 10, family: `'Space Grotesk', 'Sora', sans-serif` },
						maxTicksLimit: 5
					}
				}
			}
		};
	}

	private computeStats(): ChartStats {
		const days = this.breakdown.length || 1;
		const avgCal = Math.round(this.breakdown.reduce((s, d) => s + d.calories, 0) / days);
		const avgProt = Math.round(this.breakdown.reduce((s, d) => s + d.protein, 0) / days);
		// d.calories > 0 excludes days with no entries from the goal count
		const calGoalDays =
			this.calorieGoal !== null
				? this.breakdown.filter(d => d.calories > 0 && d.calories <= this.calorieGoal!).length
				: null;
		const protGoalDays =
			this.proteinGoal !== null ? this.breakdown.filter(d => d.protein >= this.proteinGoal!).length : null;
		return { avgCal, avgProt, calGoalDays, protGoalDays, days };
	}

	private renderPeriodTabs() {
		const tabs: { label: string; value: Period }[] = [
			{ label: 'Woche', value: 'weekly' },
			{ label: 'Monat', value: 'monthly' }
		];
		return html`
			<div class="period-tabs">
				${tabs.map(
					t => html`
						<button
							class="period-tab ${this.period === t.value ? 'active' : ''}"
							type="button"
							@click=${() => void this.handlePeriodChange(t.value)}
						>
							${t.label}
						</button>
					`
				)}
			</div>
		`;
	}

	private renderCharts() {
		// compute once and share across both chart blocks instead of recomputing per block
		const stats = this.computeStats();
		return html`
			<div class="chart-section">
				${this.renderChartBlock('calories', stats)}
				<div class="chart-divider"></div>
				${this.renderChartBlock('protein', stats)}
			</div>
		`;
	}

	private renderChartBlock(type: 'calories' | 'protein', stats: ChartStats) {
		const isCalories = type === 'calories';
		const title = isCalories ? 'Kalorien' : 'Protein';
		const canvasId = isCalories ? 'calories-canvas' : 'protein-canvas';
		return html`
			<div class="chart-block">
				<div class="chart-block-title">${title}</div>
				<div class="chart-canvas-wrapper">
					<canvas id="${canvasId}"></canvas>
				</div>
				<div class="stat-chips">${this.renderStatChips(type, stats)}</div>
			</div>
		`;
	}

	private renderStatChips(type: 'calories' | 'protein', stats: ChartStats) {
		const { avgCal, avgProt, calGoalDays, protGoalDays, days } = stats;
		if (type === 'calories') {
			return html`
				<span class="stat-chip">Ø ${avgCal} kcal</span>
				${calGoalDays !== null
					? html`<span class="stat-chip chip-goal">${calGoalDays}/${days} Tage Ziel ✓</span>`
					: nothing}
			`;
		}
		return html`
			<span class="stat-chip">Ø ${avgProt}g</span>
			${protGoalDays !== null
				? html`<span class="stat-chip chip-goal">${protGoalDays}/${days} Tage Ziel ✓</span>`
				: nothing}
		`;
	}

	private async handlePeriodChange(p: Period) {
		if (p === this.period) return;
		this.period = p;
		await this.loadData();
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-food-chart-card': FoodChartCardComponent;
	}
}
