/**
 * Autor: Luca Lammers

 */

import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './popular-times.css?inline';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };

/** Defines bento popular times. */
@customElement('bento-popular-times')
export class BentoPopularTimes extends LitElement {
	static readonly styles = [componentStyle];

	@property({ type: Array }) data: { hour: number; count: number }[] = [];

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
			<span class="card-title" data-testid="popular-times-title">Beliebteste Zeiten</span>
			<div class="card-body">
				<canvas data-testid="popular-times-canvas"></canvas>
			</div>
		`;
	}

	/** Initializes chart. */
	private initChart() {
		const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
		if (!canvas) return;
		this.chart?.destroy();
		this.chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: this.data.map(
					/**
					 * Transforms one item for the rendered or derived collection.
					 * @param {{ hour: number; count: number; }} t t.
					 * @returns {string} The formatted string.
					 */
					t => `${String(t.hour).padStart(2, '0')}:00`
				),
				datasets: [
					{
						label: 'Sitzungen',
						data: this.data.map(
							/**
							 * Transforms one item for the rendered or derived collection.
							 * @param {{ hour: number; count: number; }} t t.
							 * @returns {number} The calculated number.
							 */
							t => t.count
						),
						borderColor: '#140095',
						backgroundColor: '#6366f180',
						borderWidth: 2
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 800, easing: 'easeOutQuart' },
				plugins: { legend: { display: false } },
				scales: { x: { min: 0, ticks: { stepSize: 500 } } }
			}
		});
	}
}
