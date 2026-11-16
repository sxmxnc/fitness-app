/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type PendingFoodItem } from '../../../../food-tracking.types.js';
import componentStyle from './food-item-list.css?inline';

@customElement('my-food-item-list')
export class FoodItemListComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: Array }) items: PendingFoodItem[] = [];
	@property({ type: Boolean }) saving = false;

	render() {
		if (this.items.length === 0) return html``;
		return html`
			<div class="item-list" data-testid="food-entry-item-list">
				${this.items.map((item, index) => {
					const kcal = Math.round(((item.caloriesPer100g ?? 0) * item.quantityGrams) / 100);
					return html`
						<div class="item-row">
							<span class="item-name">${item.displayName}</span>
							<span class="item-qty">${item.quantityGrams} g | ${kcal} kcal</span>
							<button
								class="item-remove"
								@click=${() =>
									this.dispatchEvent(
										// detail is the array index — parent removes by position, not by id
										new CustomEvent<number>('item-removed', {
											detail: index,
											bubbles: true,
											composed: true
										})
									)}
								?disabled=${this.saving}
								type="button"
							>
								✕
							</button>
						</div>
					`;
				})}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-food-item-list': FoodItemListComponent;
	}
}
