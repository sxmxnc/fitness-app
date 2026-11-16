/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './food-entry-list.css?inline';
import {
	type Period,
	type MealEntry,
	type MealEntryFoodWithNutrition,
	MEAL_TYPES,
	MEAL_TYPE_LABELS
} from '../../food-tracking.types.js';

@customElement('my-food-entry-list')
export class FoodEntryListComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: String }) period: Period = 'daily';
	@property({ type: Array }) entries: MealEntry[] = [];
	@property({ type: Object }) entryFoodsMap: Map<string, MealEntryFoodWithNutrition[]> = new Map();

	render() {
		if (this.period !== 'daily') return html``;
		return this.entries.length === 0 ? this.renderEmptyState() : this.renderEntries();
	}

	private renderEmptyState() {
		return html`
			<div class="empty-state">
				<div class="empty-icon">🥗</div>
				<div class="empty-title">Heute noch keine Mahlzeit eingetragen</div>
				<div class="empty-subtitle">Tippe auf '+ Mahlzeit hinzufügen' zum Starten</div>
			</div>
		`;
	}

	private renderEntries() {
		// sort by predefined meal-type order (breakfast → lunch → dinner → snack)
		const sorted = [...this.entries].sort(
			(a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType)
		);
		return html`
			<div class="entries-list">
				${sorted.map((entry, index) => {
					const showDivider = index > 0 && sorted[index - 1].mealType !== entry.mealType; // divider between meal types, not every entry
					const foods = this.entryFoodsMap.get(entry.id) ?? [];
					const entryCalories = foods.reduce(
						(sum, item) => sum + Math.round(((item.food.caloriesPer100g ?? 0) * item.quantityGrams) / 100),
						0
					);
					const entryWeight = foods.reduce((sum, item) => sum + item.quantityGrams, 0);
					return html`
						${showDivider ? html`<div class="meal-type-divider"></div>` : ''}
						<div class="food-card entry-card">
							<div class="entry-header">
								<span class="entry-meal-badge">${MEAL_TYPE_LABELS[entry.mealType]}</span>
								<div class="entry-totals">
									<span class="entry-total-value">${entryWeight}g</span>
									<span class="entry-totals-divider">|</span>
									<span class="entry-total-value">${entryCalories} kcal</span>
								</div>
								<button
									class="entry-delete-btn"
									title="Eintrag löschen"
									@click=${() =>
										this.dispatchEvent(
											new CustomEvent('entry-delete', {
												detail: { entryId: entry.id },
												bubbles: true,
												composed: true
											})
										)}
								>
									✕
								</button>
							</div>
							${foods.map(item => {
								const factor = item.quantityGrams / 100;
								const protein = Math.round((item.food.proteinPer100g ?? 0) * factor);
								const fat = Math.round((item.food.fatPer100g ?? 0) * factor);
								const carbs = Math.round((item.food.carbsPer100g ?? 0) * factor);
								return html`
									<div class="food-item">
										<span class="food-item-name">${item.food.name}</span>
										<span class="food-item-macros">
											Eiweiß: ${protein}g | Fett: ${fat}g | Kohlenhydrate: ${carbs}g
										</span>
									</div>
								`;
							})}
						</div>
					`;
				})}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-food-entry-list': FoodEntryListComponent;
	}
}
