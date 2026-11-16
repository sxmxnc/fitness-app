/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './user-activity.css?inline';
import { BASE_API } from '../../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(PieController, ArcElement, Tooltip, Legend);
Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };

const DEFAULT_FROM = '2024-01-01';
const DEFAULT_TO = '2024-04-12';

/** Defines bento user activity. */
@customElement('bento-user-activity')
export class BentoUserActivity extends LitElement {
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
		const fromInput = this.shadowRoot?.querySelector('#activity-from') as HTMLInputElement;
		const toInput = this.shadowRoot?.querySelector('#activity-to') as HTMLInputElement;

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
			<span class="card-title" data-testid="user-activity-title">Nutzer Aktivität</span>
			<div class="chart-controls" data-testid="user-activity-controls">
				<input type="date" id="activity-from" data-testid="activity-from-input" @change=${this.onDateChange} />
				<span>-</span>
				<input type="date" id="activity-to" data-testid="activity-to-input" @change=${this.onDateChange} />
				<button
					id="activity-refresh"
					data-testid="activity-refresh-btn"
					class="refresh-btn"
					style="display:none"
					@click=${this.onRefresh}
				>
					Aktualisieren
				</button>
				<span
					id="activity-error"
					data-testid="activity-error-msg"
					class="date-error"
					style="display:none"
				></span>
			</div>
			<div class="card-body">
				<canvas data-testid="activity-chart-canvas"></canvas>
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
		const fromInput = this.shadowRoot?.querySelector('#activity-from') as HTMLInputElement;
		const toInput = this.shadowRoot?.querySelector('#activity-to') as HTMLInputElement;
		const btn = this.shadowRoot?.querySelector('#activity-refresh') as HTMLElement;
		const error = this.shadowRoot?.querySelector('#activity-error') as HTMLElement;
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
		const fromInput = this.shadowRoot?.querySelector('#activity-from') as HTMLInputElement;
		const toInput = this.shadowRoot?.querySelector('#activity-to') as HTMLInputElement;
		const btn = this.shadowRoot?.querySelector('#activity-refresh') as HTMLElement;

		if (btn) btn.style.display = 'none';

		await this.loadChart(new Date(fromInput.value), new Date(toInput.value));
	}

	/**
	 * Loads chart.
	 * @param {Date} from from.
	 * @param {Date} to to.
	 */
	private async loadChart(from: Date, to: Date) {
		const start = new Date(from);
		start.setUTCHours(0, 0, 0, 0);
		const end = new Date(to);
		end.setUTCHours(23, 59, 59, 999);
		const res = await this.http.get(
			`${BASE_API}/admin/stats/user-activity?from=${start.getTime()}&to=${end.getTime()}`
		);
		const { registeredUsers, activeUsers }: { registeredUsers: number; activeUsers: number } = await res.json();

		const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
		if (!canvas) return;
		this.chart?.destroy();
		this.chart = null;

		this.chart = new Chart(canvas, {
			type: 'pie',
			data: {
				labels: ['Registriert', 'Aktiv'],
				datasets: [
					{
						data: [registeredUsers, activeUsers],
						backgroundColor: ['#d0d4e0', '#14009580'],
						borderColor: ['#b0b4c0', '#140095'],
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 800, easing: 'easeOutQuart' },
				plugins: {
					legend: { position: 'bottom', labels: { font: { size: 11 } } },
					tooltip: { enabled: true }
				}
			}
		});
	}
}
