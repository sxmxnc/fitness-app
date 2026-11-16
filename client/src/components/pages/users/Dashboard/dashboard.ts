/**
 * Autor: Luca Lammers

 * Autor: Simon Josef Cebula

 * Autor: Justus Heinz

 */
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import '../common/user-header/user-header';
import '../common/user-nav/user-nav';
import componentStyle from './dashboard.css?inline';
import { Router, routerContext } from '../../../../router.js';
import './components/food-chart-card/food-chart-card.js';
import './components/activity-heatmap/activity-heatmap.js';
import './components/exercise-heatmap/exercise-heatmap.js';

/** Defines dashboard. */
@customElement('app-dashboard')
export class Dashboard extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: routerContext }) private readonly router!: Router;

	/** Initializes component state after the element is connected. */
	override connectedCallback() {
		super.connectedCallback();
		this.textContent = 'Training Protein';
		void this.init();
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<app-header></app-header>
			<div class="page-content">
				<my-activity-heatmap></my-activity-heatmap>
				<my-exercise-heatmap></my-exercise-heatmap>
				<my-food-chart-card></my-food-chart-card>
			</div>
			<app-nav></app-nav>
		`;
	}

	/** Initializes init. */
	private async init() {
		// redirect before widgets mount so they never fire unauthenticated API calls
		if (!localStorage.getItem('token')) {
			await this.router.push('/');
		}
	}
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'app-dashboard': Dashboard;
	}
}
