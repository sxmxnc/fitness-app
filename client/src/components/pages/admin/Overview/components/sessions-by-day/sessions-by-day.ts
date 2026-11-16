/**
 * Autor: Luca Lammers

 */

import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './sessions-by-day.css?inline';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };

/** Defines bento sessions by day. */
@customElement('bento-sessions-by-day')
export class BentoSessionsByDay extends LitElement {
	static readonly styles = [componentStyle];

	@property({ type: Array }) data: { day: number; count: number }[] = [];

	private chart: Chart | null = null;

	/** Cleans up component resources after the element is disconnected. */
	disconnectedCallback() {
		super.disconnectedCallback();
		this.chart?.destroy();
		this.chart = null;
	}

	/**
	 * Responds to Lit property updates after rendering.
	 * @param {PropertyValues} changed changed.
	 */
	updated(changed: PropertyValues) {
		if (changed.has('data') && this.data.length > 0) {
			requestAnimationFrame(
				/** Handles the inline callback for the surrounding UI operation. */
				() => this.initChart()
			);
		}
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<span class="card-title" data-testid="sessions-by-day-title">Sitzungen nach Tag</span>
			<div class="card-body">
				<canvas data-testid="sessions-by-day-canvas"></canvas>
			</div>
		`;
	}

	/** Initializes chart. */
	private initChart() {
		const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
		if (!canvas) return;
		this.chart?.destroy();
		const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
		this.chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: this.data.map(
					/**
					 * Transforms one item for the rendered or derived collection.
					 * @param {{ day: number; count: number; }} d d.
					 * @returns {string} The formatted string.
					 */
					d => dayNames[d.day] ?? `Tag ${d.day}`
				),
				datasets: [
					{
						label: 'Sitzungen',
						data: this.data.map(
							/**
							 * Transforms one item for the rendered or derived collection.
							 * @param {{ day: number; count: number; }} d d.
							 * @returns {number} The calculated number.
							 */
							d => d.count
						),
						borderColor: '#140095',
						backgroundColor: '#6366f180',
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 800, easing: 'easeOutQuart' },
				plugins: { legend: { display: false } },
				scales: { y: { min: 0, ticks: { stepSize: 500 } } }
			}
		});
	}
}
