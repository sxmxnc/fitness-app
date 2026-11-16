/**
 * Autor: Luca Lammers

 */
import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from '../../UserOverview.css?inline';
import {
	Chart,
	BarController,
	BarElement,
	LineController,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip
} from 'chart.js';
import type { Session } from '../session-chart-data';
import {
	buildLoginChartData,
	buildPopularTimesData,
	buildPopularDaysData,
	buildMonthlyActivityData,
	buildDurationTimelineData,
	buildDurationDistData,
	buildMonthlyDurationData
} from '../session-chart-data';

Chart.register(
	BarController,
	BarElement,
	LineController,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip
);

/** Defines the popup tab overview Lit component. */
@customElement('popup-tab-overview')
export class PopupTabOverview extends LitElement {
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

	@property({ type: Array }) sessions: Session[] = [];

	private loginChart: Chart | null = null;
	private timesChart: Chart | null = null;
	private daysChart: Chart | null = null;
	private monthChart: Chart | null = null;
	private durationTimelineChart: Chart | null = null;
	private durationDistChart: Chart | null = null;
	private durationMonthlyChart: Chart | null = null;

	/**
	 * Handles avg session duration.
	 * @returns {string} The formatted string.
	 */
	private get avgSessionDuration(): string {
		const finished = this.sessions.filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {Session} s s.
			 * @returns {boolean} True when the condition is met.
			 */
			s => s.isFinished && s.finishedAt != null
		);
		if (finished.length === 0) return '—';
		const totalMs = finished.reduce(
			/**
			 * Accumulates one item into the aggregate result.
			 * @param {number} sum sum.
			 * @param {Session} s s.
			 * @returns {number} The calculated number.
			 */
			(sum, s) => sum + (Number(s.finishedAt) - Number(s.startedAt)),
			0
		);
		const totalSecs = Math.round(totalMs / finished.length / 1000);
		const mins = Math.floor(totalSecs / 60);
		const secs = totalSecs % 60;
		if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
		return `${mins}m ${secs}s`;
	}

	/**
	 * Handles longest streak.
	 * @returns {number} The calculated number.
	 */
	private get longestStreak(): number {
		if (this.sessions.length === 0) return 0;
		const DAY_MS = 86_400_000;
		const days = [
			...new Set(
				this.sessions.map(
					/**
					 * Transforms one item for the rendered or derived collection.
					 * @param {Session} s s.
					 * @returns {number} The calculated number.
					 */
					s => {
						const d = new Date(Number(s.startedAt));
						return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
					}
				)
			)
		].sort(
			/**
			 * Compares two items for the requested display order.
			 * @param {number} a a.
			 * @param {number} b b.
			 * @returns {number} The calculated number.
			 */
			(a, b) => a - b
		);
		let longest = 1,
			current = 1;
		for (let i = 1; i < days.length; i++) {
			current = days[i] - days[i - 1] === DAY_MS ? current + 1 : 1;
			if (current > longest) longest = current;
		}
		return longest;
	}

	/** Cleans up component resources after the element is disconnected. */
	disconnectedCallback() {
		super.disconnectedCallback();
		this.destroyCharts();
	}

	/**
	 * Responds to Lit property updates after rendering.
	 * @param {PropertyValues} changedProps changed props.
	 */
	updated(changedProps: PropertyValues) {
		if (changedProps.has('sessions')) {
			this.renderAllCharts();
		}
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		if (this.sessions.length === 0) {
			return html`
				<div class="popup-empty" data-testid="user-popup-empty-state">
					<i class="fa-solid fa-user-slash"></i>
					<span>Keine Aktivitätsdaten vorhanden</span>
				</div>
			`;
		}

		return html`
			<div class="popup-overview" data-testid="user-popup-overview">
				<div class="overview-stats">
					<div class="stat-card" data-testid="user-popup-stat-total-logins">
						<span class="stat-label">Gesamte Logins</span>
						<span class="stat-value">${this.sessions.length}</span>
					</div>
					<div class="stat-card" data-testid="user-popup-stat-avg-duration">
						<span class="stat-label">Ø Sitzungsdauer</span>
						<span class="stat-value">${this.avgSessionDuration}</span>
					</div>
					<div class="stat-card" data-testid="user-popup-stat-streak">
						<span class="stat-label">Längste Streak</span>
						<span class="stat-value"
							>${this.longestStreak} ${this.longestStreak === 1 ? 'Tag' : 'Tage'}</span
						>
					</div>
				</div>
				<div class="charts-col">
					<div class="chart-section">
						<div class="chart-title">Logins dieses Jahr</div>
						<div class="chart-wrap"><canvas id="login-chart"></canvas></div>
					</div>
					<div class="charts-row">
						<div class="chart-section">
							<div class="chart-title">Aktivität pro Monat (Letzte 12 Monate)</div>
							<div class="chart-wrap"><canvas id="month-chart"></canvas></div>
						</div>
						<div class="chart-section">
							<div class="chart-title">Sitzungsdauer-Verteilung</div>
							<div class="chart-wrap"><canvas id="duration-dist-chart"></canvas></div>
						</div>
					</div>
					<div class="charts-row">
						<div class="chart-section">
							<div class="chart-title">Sitzungsdauer-Verlauf (Letzte 30 Tage)</div>
							<div class="chart-wrap"><canvas id="duration-timeline-chart"></canvas></div>
						</div>
						<div class="chart-section">
							<div class="chart-title">Sitzungsdauer Entwicklung</div>
							<div class="chart-wrap"><canvas id="duration-monthly-chart"></canvas></div>
						</div>
					</div>
					<div class="charts-row">
						<div class="chart-section">
							<div class="chart-title">Lieblingszeiten</div>
							<div class="chart-wrap"><canvas id="times-chart"></canvas></div>
						</div>
						<div class="chart-section">
							<div class="chart-title">Lieblingstage</div>
							<div class="chart-wrap"><canvas id="days-chart"></canvas></div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	/** Handles destroy charts. */
	private destroyCharts() {
		this.loginChart?.destroy();
		this.loginChart = null;
		this.timesChart?.destroy();
		this.timesChart = null;
		this.daysChart?.destroy();
		this.daysChart = null;
		this.monthChart?.destroy();
		this.monthChart = null;
		this.durationTimelineChart?.destroy();
		this.durationTimelineChart = null;
		this.durationDistChart?.destroy();
		this.durationDistChart = null;
		this.durationMonthlyChart?.destroy();
		this.durationMonthlyChart = null;
	}

	/**
	 * Handles make bar chart.
	 * @param {string} canvasId canvas id.
	 * @param {string[]} labels labels.
	 * @param {number[]} data data.
	 * @param {string} color color.
	 * @param {number} stepSize step size.
	 * @returns {Chart | null} The operation result.
	 */
	private makeBarChart(
		canvasId: string,
		labels: string[],
		data: number[],
		color: string,
		stepSize = 1
	): Chart | null {
		const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>(`#${canvasId}`);
		if (!canvas) return null;
		return new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [{ data, backgroundColor: color, borderRadius: 4, borderSkipped: false }]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 800, easing: 'easeOutQuart' },
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: /**
							 * Handles label.
							 * @param {TooltipItem<'bar'>} item item.
							 * @returns {string} The formatted string.
							 */ item => ` ${item.raw}`
						}
					}
				},
				scales: {
					x: { grid: { display: false }, ticks: { font: { size: 11 } } },
					y: {
						beginAtZero: true,
						ticks: { stepSize, font: { size: 11 } },
						grid: { color: 'var(--color-border-soft)' }
					}
				}
			}
		});
	}

	/**
	 * Handles make line chart.
	 * @param {string} canvasId canvas id.
	 * @param {string[]} labels labels.
	 * @param {number[]} data data.
	 * @param {string} color color.
	 * @param {string} yLabel y label.
	 * @param {number} maxXTicks max xticks.
	 * @returns {Chart | null} The operation result.
	 */
	private makeLineChart(
		canvasId: string,
		labels: string[],
		data: number[],
		color: string,
		yLabel = '',
		maxXTicks?: number
	): Chart | null {
		const canvas = this.shadowRoot?.querySelector<HTMLCanvasElement>(`#${canvasId}`);
		if (!canvas) return null;
		return new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data,
						borderColor: color,
						backgroundColor: color + '22',
						borderWidth: 2,
						pointRadius: data.length > 60 ? 0 : 3,
						tension: 0.3,
						fill: true
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 800, easing: 'easeOutQuart' },
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: /**
							 * Handles label.
							 * @param {TooltipItem<'line'>} item item.
							 * @returns {string} The formatted string.
							 */ item => ` ${item.raw}${yLabel ? ' ' + yLabel : ''}`
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: { font: { size: 11 }, ...(maxXTicks ? { maxTicksLimit: maxXTicks } : {}) }
					},
					y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: 'var(--color-border-soft)' } }
				}
			}
		});
	}

	/** Renders all charts. */
	private renderAllCharts() {
		requestAnimationFrame(
			/** Handles the inline callback for the surrounding UI operation. */
			() => {
				this.destroyCharts();

				const loginData = buildLoginChartData(this.sessions);
				this.loginChart = this.makeBarChart('login-chart', loginData.labels, loginData.data, '#3b82f6');

				const monthlyActivity = buildMonthlyActivityData(this.sessions);
				this.monthChart = this.makeBarChart(
					'month-chart',
					monthlyActivity.labels,
					monthlyActivity.data,
					'#3b82f6'
				);

				const durationDist = buildDurationDistData(this.sessions);
				this.durationDistChart = this.makeBarChart(
					'duration-dist-chart',
					durationDist.labels,
					durationDist.data,
					'#3b82f6'
				);

				if (this.sessions.length > 0) {
					const popularTimes = buildPopularTimesData(this.sessions);
					this.timesChart = this.makeBarChart(
						'times-chart',
						popularTimes.labels,
						popularTimes.data,
						'#3b82f6',
						20
					);

					const popularDays = buildPopularDaysData(this.sessions);
					this.daysChart = this.makeBarChart(
						'days-chart',
						popularDays.labels,
						popularDays.data,
						'#3b82f6',
						20
					);

					const durationTimeline = buildDurationTimelineData(this.sessions);
					this.durationTimelineChart = this.makeLineChart(
						'duration-timeline-chart',
						durationTimeline.labels,
						durationTimeline.data,
						'#3b82f6',
						'min',
						6
					);

					const durationMonthly = buildMonthlyDurationData(this.sessions);
					this.durationMonthlyChart = this.makeLineChart(
						'duration-monthly-chart',
						durationMonthly.labels,
						durationMonthly.data,
						'#3b82f6',
						'min',
						6
					);
				}
			}
		);
	}
}
