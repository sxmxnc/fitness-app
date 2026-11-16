/**
 * Autor: Luca Lammers

 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { BASE_API } from '../../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import componentStyle from './activity-heatmap.css?inline';

/** Describes the activity day shape. */
type ActivityDay = { day: string; count: number };

/** Defines the activity heatmap component Lit component. */
@customElement('my-activity-heatmap')
export class ActivityHeatmapComponent extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private activity: Map<string, number> = new Map();
	@state() private loading = true;
	@state() private tooltip: { text: string; x: number; y: number } | null = null;

	/** Initializes component state after the element is connected. */
	override connectedCallback() {
		super.connectedCallback();
		void this.loadActivity();
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		const weeks = this.buildGrid();
		const totalactivity = [...this.activity.values()].reduce(
			/**
			 * Accumulates one item into the aggregate result.
			 * @param {number} a a.
			 * @param {number} b b.
			 * @returns {number} The calculated number.
			 */
			(a, b) => a + b,
			0
		);
		const activeDays = [...this.activity.values()].filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {number} v v.
			 * @returns {boolean} True when the condition is met.
			 */
			v => v > 0
		).length;
		return html`
			<div class="dashboard-card">
				<div class="card-header">
					<h2>Aktivität</h2>
					<span class="card-subtitle"
						>${totalactivity} Training${totalactivity !== 1 ? 's' : ''} · ${activeDays} aktiver
						Tag${activeDays !== 1 ? 'e' : ''} im vergangenen Jahr</span
					>
				</div>
				${this.loading
					? html`<div class="loading-state">Aktivität wird geladen...</div>`
					: html`
							<div class="heatmap-wrapper">
								<div class="heatmap-body">
									${this.renderDayLabels()}
									<div class="heatmap-cols">
										${this.renderMonthLabels(weeks)} ${this.renderGrid(weeks)}
									</div>
								</div>
								${this.renderLegend()}
							</div>
							${this.renderTooltip()}
						`}
			</div>
		`;
	}

	/** Loads activity. */
	private async loadActivity() {
		const id = localStorage.getItem('userId')!;
		const to = Date.now();
		const from = to - 52 * 7 * 24 * 60 * 60 * 1000;
		try {
			const res = await this.http.get(`${BASE_API}/usersStats/${id}/activity?from=${from}&to=${to}`);
			if (!res.ok) return;
			const data: ActivityDay[] = await res.json();
			this.activity = new Map(
				data.map(
					/**
					 * Transforms one item for the rendered or derived collection.
					 * @param {ActivityDay} d d.
					 * @returns {[string, number]} The operation result.
					 */
					d => [d.day, d.count]
				)
			);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Builds grid.
	 * @returns {{ date: Date; dateStr: string }[][]} The operation result.
	 */
	private buildGrid(): { date: Date; dateStr: string }[][] {
		const todayStr = new Date().toISOString().slice(0, 10);
		const start = new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000);
		start.setUTCHours(0, 0, 0, 0);
		const dow = start.getUTCDay();
		// align to the preceding Monday so every week column starts on Mo
		const mondayOffset = dow === 0 ? -6 : 1 - dow;
		start.setUTCDate(start.getUTCDate() + mondayOffset);

		const weeks: { date: Date; dateStr: string }[][] = [];
		const cursor = new Date(start);
		while (cursor.toISOString().slice(0, 10) <= todayStr) {
			const week: { date: Date; dateStr: string }[] = [];
			for (let d = 0; d < 7; d++) {
				const dateStr = cursor.toISOString().slice(0, 10);
				week.push({ date: new Date(cursor), dateStr });
				cursor.setUTCDate(cursor.getUTCDate() + 1);
			}
			weeks.push(week);
		}
		return weeks;
	}

	/**
	 * Handles color level.
	 * @param {number} count count.
	 * @returns {string} The formatted string.
	 */
	private colorLevel(count: number): string {
		if (count === 0) return 'level-0';
		if (count === 1) return 'level-1';
		if (count === 2) return 'level-2';
		if (count >= 3) return 'level-3';
		return 'level-0';
	}

	/**
	 * Formats date.
	 * @param {string} dateStr date str.
	 * @returns {string} The formatted string.
	 */
	private formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00Z');
		return d.toLocaleDateString('de-DE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}

	/**
	 * Handles cell mouse enter.
	 * @param {MouseEvent} e DOM event emitted by the UI.
	 * @param {string} dateStr date str.
	 */
	private onCellMouseEnter(e: MouseEvent, dateStr: string) {
		const count = this.activity.get(dateStr) ?? 0;
		let label: string;
		if (count === 0) label = 'Keine Aktivität';
		else if (count === 1) label = '1 Training';
		else label = `${count} Aktivitäten`;
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		// position is relative to the host element because the tooltip uses position: absolute inside the card
		const hostRect = this.getBoundingClientRect();
		this.tooltip = {
			text: `${label} · ${this.formatDate(dateStr)}`,
			x: rect.left - hostRect.left + rect.width / 2,
			y: rect.top - hostRect.top - 8
		};
	}

	/** Handles cell mouse leave. */
	private onCellMouseLeave() {
		this.tooltip = null;
	}

	/**
	 * Renders tooltip.
	 * @returns {TemplateResult<1> | ''} The Lit template to render.
	 */
	private renderTooltip() {
		if (!this.tooltip) return '';
		return html`<div class="tooltip" style="left:${this.tooltip.x}px; top:${this.tooltip.y}px">
			${this.tooltip.text}
		</div>`;
	}

	/**
	 * Renders month labels.
	 * @param {{ date: Date; dateStr: string }[][]} weeks weeks.
	 * @returns {ReturnType<typeof html>} The operation result.
	 */
	private renderMonthLabels(weeks: { date: Date; dateStr: string }[][]): ReturnType<typeof html> {
		const labels: { label: string; col: number }[] = [];
		let lastMonth = -1;
		weeks.forEach(
			/**
			 * Handles the inline callback for the surrounding UI operation.
			 * @param {{ date: Date; dateStr: string; }[]} week week.
			 * @param {number} i i.
			 */
			(week, i) => {
				const month = week[0].date.getMonth();
				if (month !== lastMonth) {
					labels.push({ label: week[0].date.toLocaleDateString('de-DE', { month: 'short' }), col: i });
					lastMonth = month;
				}
			}
		);
		return html`
			<div class="month-labels" style="grid-template-columns: repeat(${weeks.length}, 1fr)">
				${labels.map(
					/**
					 * Transforms one item for the rendered or derived collection.
					 * @param {{ label: string; col: number; }} { label, col } { label, col }.
					 * @returns {TemplateResult<1>} The Lit template to render.
					 */
					({ label, col }) => html`
						<span class="month-label" style="grid-column: ${col + 1}">${label}</span>
					`
				)}
			</div>
		`;
	}

	/**
	 * Renders grid.
	 * @param {{ date: Date; dateStr: string }[][]} weeks weeks.
	 * @returns {ReturnType<typeof html>} The operation result.
	 */
	private renderGrid(weeks: { date: Date; dateStr: string }[][]): ReturnType<typeof html> {
		return html`
			<div class="heatmap-grid" style="grid-template-columns: repeat(${weeks.length}, 1fr)">
				${weeks.map(
					/**
					 * Transforms one item for the rendered or derived collection.
					 * @param {{ date: Date; dateStr: string; }[]} week week.
					 * @returns {TemplateResult<1>} The Lit template to render.
					 */
					week => html`
						<div class="week-col">
							${week.map(
								/**
								 * Transforms one item for the rendered or derived collection.
								 * @param {{ date: Date; dateStr: string; }} { dateStr } { date str }.
								 * @returns {TemplateResult<1>} The Lit template to render.
								 */
								({ dateStr }) => {
									const count = this.activity.get(dateStr) ?? 0;
									const future = dateStr > new Date().toISOString().slice(0, 10);
									return html`
										<div
											class="day-cell ${future ? 'future' : this.colorLevel(count)}"
											@mouseenter=${
												/**
												 * Handles the inline callback for the surrounding UI operation.
												 * @param {MouseEvent} e DOM event emitted by the UI.
												 */
												(e: MouseEvent) => !future && this.onCellMouseEnter(e, dateStr)
											}
											@mouseleave=${
												/** Handles the inline callback for the surrounding UI operation. */
												() => this.onCellMouseLeave()
											}
										></div>
									`;
								}
							)}
						</div>
					`
				)}
			</div>
		`;
	}

	/**
	 * Renders day labels.
	 * @returns {ReturnType<typeof html>} The operation result.
	 */
	private renderDayLabels(): ReturnType<typeof html> {
		return html`
			<div class="day-labels">
				<span>Mo</span>
				<span></span>
				<span>Mi</span>
				<span></span>
				<span>Fr</span>
				<span></span>
				<span>So</span>
			</div>
		`;
	}

	/**
	 * Renders legend.
	 * @returns {ReturnType<typeof html>} The operation result.
	 */
	private renderLegend(): ReturnType<typeof html> {
		return html`
			<div class="legend">
				<span>Weniger</span>
				<div class="day-cell level-0"></div>
				<div class="day-cell level-1"></div>
				<div class="day-cell level-2"></div>
				<div class="day-cell level-3"></div>
				<span>Mehr</span>
			</div>
		`;
	}
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'my-activity-heatmap': ActivityHeatmapComponent;
	}
}
