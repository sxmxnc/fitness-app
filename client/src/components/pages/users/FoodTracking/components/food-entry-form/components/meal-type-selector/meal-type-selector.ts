/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type MealType, MEAL_TYPES, MEAL_TYPE_LABELS } from '../../../../food-tracking.types.js';
import componentStyle from './meal-type-selector.css?inline';

@customElement('my-meal-type-selector')
export class MealTypeSelectorComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: String }) mealType: MealType = 'breakfast';

	render() {
		return html`
			<div class="form-group">
				<label>Mahlzeit</label>
				<div class="meal-type-grid">
					${MEAL_TYPES.map(
						type => html`
							<button
								class="meal-type-btn ${this.mealType === type ? 'active' : ''}"
								@click=${() =>
									this.dispatchEvent(
										new CustomEvent<MealType>('meal-type-change', {
											detail: type,
											bubbles: true,
											composed: true
										})
									)}
								type="button"
							>
								${MEAL_TYPE_LABELS[type]}
							</button>
						`
					)}
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-meal-type-selector': MealTypeSelectorComponent;
	}
}
