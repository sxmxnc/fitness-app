/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './macro-preview.css?inline';

@customElement('my-macro-preview')
export class MacroPreviewComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: Number }) quantity = 100;
	@property({ type: Number }) calories = 0;
	@property({ type: Number }) protein = 0;
	@property({ type: Number }) fat = 0;
	@property({ type: Number }) carbs = 0;
	@property({ type: Boolean }) overLimit = false;

	render() {
		// all props are per-100g values; factor scales them to the entered quantity
		const factor = this.quantity > 0 ? this.quantity / 100 : 1;
		const displayKcal = Math.round(this.calories * factor);
		const displayProt = Math.round(this.protein * factor * 10) / 10;
		const displayFat = Math.round(this.fat * factor * 10) / 10;
		const displayCarbs = Math.round(this.carbs * factor * 10) / 10;

		return html`
			<div class="macro-preview">
				<div class="macro-preview-title">Nährwerte für ${this.quantity} g</div>
				<div class="macro-preview-row">
					<span class="macro-preview-label">Kalorien</span>
					<span class="macro-preview-value">${displayKcal} kcal</span>
				</div>
				<div class="macro-preview-row">
					<span class="macro-preview-label">Eiweiß</span>
					<span class="macro-preview-value ${this.overLimit ? 'over-limit' : ''}">${displayProt} g</span>
				</div>
				<div class="macro-preview-row">
					<span class="macro-preview-label">Fett</span>
					<span class="macro-preview-value ${this.overLimit ? 'over-limit' : ''}">${displayFat} g</span>
				</div>
				<div class="macro-preview-row">
					<span class="macro-preview-label">Kohlenhydrate</span>
					<span class="macro-preview-value ${this.overLimit ? 'over-limit' : ''}">${displayCarbs} g</span>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-macro-preview': MacroPreviewComponent;
	}
}
