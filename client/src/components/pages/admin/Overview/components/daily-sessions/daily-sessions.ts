/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './daily-sessions.css?inline';
import { BASE_API } from '../../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import {
	Chart,
	LineController,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
	Filler
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);
Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };

const DEFAULT_FROM = '2024-01-01';
const DEFAULT_TO = '2024-04-12';

/** Defines bento daily sessions. */
@customElement('bento-daily-sessions')
export class BentoDailySessions extends LitElement {
	static readonly styles = [componentStyle];

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	private chart: Chart | null = null;

	/** Cleans up component resources after the element is disconnected. */
	disconnectedCallback() {
		super.disconnectedCallback();
		this.chart?.destroy();
		this.chart = null;
	}

	/** Initializes component state after the element is connected. */
	async connectedCallback() {
		super.connectedCallback();
		await this.updateComplete;
		const fromInput = this.shadowRoot?.querySelector('#sessions-from') as HTMLInputElement;
		const toInput = this.shadowRoot?.querySelector('#sessions-to') as HTMLInputElement;
		if (fromInput) fromInput.value = DEFAULT_FROM;
		if (toInput) toInput.value = DEFAULT_TO;
		await this.loadChart(new Date(DEFAULT_FROM), new Date(DEFAULT_TO));
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<span class="card-title" data-testid="daily-sessions-title">Tägliche Sitzungen</span>
			<div class="chart-controls" data-testid="daily-sessions-controls">
				<input type="date" id="sessions-from" data-testid="sessions-from-input" @change=${this.onDateChange} />
				<span>-</span>
				<input type="date" id="sessions-to" data-testid="sessions-to-input" @change=${this.onDateChange} />
				<button
					id="sessions-refresh"
					data-testid="sessions-refresh-btn"
					class="refresh-btn"
					style="display:none"
					@click=${this.onRefresh}
				>
					Aktualisieren
				</button>
				<span
					id="sessions-error"
					data-testid="sessions-error-msg"
					class="date-error"
					style="display:none"
				></span>
			</div>
			<div class="card-body">
				<canvas data-testid="sessions-chart-canvas"></canvas>
			</div>
		`;
	}

	/**
	 * Validates date range.
	 * @param {string} fromValue from value.
	 * @param {string} toValue to value.
	 * @returns {string | null} The operation result.
	 */
	private validateDateRange(fromValue: string, toValue: string): string | null {
		const from = new Date(fromValue);
		const to = new Date(toValue);

		if (!fromValue || isNaN(from.getTime())) return 'Ungültiges Startdatum';
		if (!toValue || isNaN(to.getTime())) return 'Ungültiges Enddatum';
		if (to < from) return 'Enddatum liegt vor dem Startdatum';

		return null;
	}

	/** Handles date change. */
	private onDateChange() {
		const fromInput = this.shadowRoot?.querySelector('#sessions-from') as HTMLInputElement;
		const toInput = this.shadowRoot?.querySelector('#sessions-to') as HTMLInputElement;
		const btn = this.shadowRoot?.querySelector('#sessions-refresh') as HTMLElement;
		const error = this.shadowRoot?.querySelector('#sessions-error') as HTMLElement;
		const msg = this.validateDateRange(fromInput?.value ?? '', toInput?.value ?? '');

		if (msg) {
			if (btn) btn.style.display = 'none';
			if (error) {
				error.textContent = msg;
				error.style.display = '';
			}
		} else {
			if (btn) btn.style.display = '';
			if (error) error.style.display = 'none';
		}
	}

	/** Handles refresh. */
	private async onRefresh() {
		const fromInput = this.shadowRoot?.querySelector('#sessions-from') as HTMLInputElement;
		const toInput = this.shadowRoot?.querySelector('#sessions-to') as HTMLInputElement;
		const btn = this.shadowRoot?.querySelector('#sessions-refresh') as HTMLElement;

		if (btn) btn.style.display = 'none';
		await this.loadChart(new Date(fromInput.value), new Date(toInput.value));
	}

	/**
	 * Loads chart.
	 * @param {Date} from from.
	 * @param {Date} to to.
	 */
	private async loadChart(from: Date, to: Date) {
		const cur = new Date(from);
		cur.setUTCHours(0, 0, 0, 0);

		const end = new Date(to);
		end.setUTCHours(23, 59, 59, 999);

		const res = await this.http.get(
			`${BASE_API}/admin/session/completed/timeframe?from=${cur.getTime()}&to=${end.getTime()}`
		);
		const aggregated: { day: string; count: number }[] = await res.json();

		const counts = new Map<string, number>();
		const iter = new Date(cur);

		while (iter <= end) {
			counts.set(iter.toISOString().slice(0, 10), 0);
			iter.setDate(iter.getDate() + 1);
		}

		for (const { day, count } of aggregated) {
			if (counts.has(day)) counts.set(day, count);
		}

		const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;

		if (!canvas) return;

		this.chart?.destroy();
		this.chart = null;

		this.chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: [...counts.keys()],
				datasets: [
					{
						label: 'Sitzungen',
						data: [...counts.values()],
						borderColor: '#140095',
						backgroundColor: '#6366f180',
						borderWidth: 2,
						fill: true,
						tension: 0.4,
						pointRadius: 4,
						pointBackgroundColor: '#140095'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 800, easing: 'easeOutQuart' },
				interaction: { mode: 'index', intersect: false },
				plugins: { legend: { display: false }, tooltip: { enabled: true } },
				scales: { y: { min: 0, ticks: { stepSize: 1 } }, x: { ticks: { maxTicksLimit: 9 } } }
			}
		});
	}
}
