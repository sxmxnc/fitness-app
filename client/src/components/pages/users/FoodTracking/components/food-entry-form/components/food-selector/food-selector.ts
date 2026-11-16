/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import componentStyle from './food-selector.css?inline';
import { type Food } from '../../../../food-tracking.types.js';

@customElement('my-food-selector')
export class FoodSelectorComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: Array }) foods: Food[] = [];
	@property({ type: String }) selectedFoodId = '';
	// number so repeated resets always produce a new value and trigger updated()
	@property({ type: Number }) resetKey = 0;

	@state() private foodSearch = '';
	@state() private foodDropdownOpen = false;
	// not @state: foodDropdownOpen triggers the re-render; position is always set before that change
	private dropdownPos: { top: number; left: number; width: number; maxHeight: number } | null = null;

	override updated(changedProperties: PropertyValues) {
		// reset search text when parent explicitly requests a reset (e.g. after addItem())
		if (changedProperties.has('resetKey') && changedProperties.get('resetKey') !== undefined) {
			this.foodSearch = '';
		}
	}

	render() {
		const selectedFood = this.foods.find(f => f.id === this.selectedFoodId);
		return html`
			<div class="form-group">
				<label>Lebensmittel</label>
				<div class="food-combobox">
					<div class="food-input-wrap">
						<input
							class="form-input food-search-input"
							type="text"
							autocomplete="off"
							placeholder="– Lebensmittel suchen –"
							.value=${this.foodSearch}
							@focus=${() => this.openFoodDropdown()}
							@input=${(e: Event) => {
								this.foodSearch = (e.target as HTMLInputElement).value;
								this.dispatchEvent(new CustomEvent('food-clear', { bubbles: true, composed: true }));
							}}
							@blur=${() => this.onSearchBlur()}
						/>
						${selectedFood
							? html`<button
									class="food-clear-btn"
									@click=${() => this.clearFoodSelection()}
									type="button"
								>
									✕
								</button>`
							: ''}
					</div>
					${this.foodDropdownOpen ? this.renderFoodDropdown() : ''}
				</div>
			</div>
		`;
	}

	private openFoodDropdown() {
		const input = this.renderRoot.querySelector<HTMLElement>('.food-search-input');
		if (!input) return;
		const rect = input.getBoundingClientRect();
		const top = rect.bottom + 4;
		// .modal lives in the parent shadow DOM — getRootNode() reaches it without piercing encapsulation
		const parentRoot = this.getRootNode() as ShadowRoot;
		const modal = parentRoot?.querySelector('.modal');
		const bottomBound = modal ? modal.getBoundingClientRect().bottom - 16 : window.innerHeight - 16;
		const maxHeight = Math.min(240, bottomBound - top);
		this.dropdownPos = { top, left: rect.left, width: rect.width, maxHeight };
		this.foodDropdownOpen = true;
		this.dispatchEvent(new CustomEvent('dropdown-toggle', { detail: true, bubbles: true, composed: true }));
	}

	private selectFood(food: Food) {
		this.foodSearch = food.name;
		this.foodDropdownOpen = false;
		this.dispatchEvent(new CustomEvent('dropdown-toggle', { detail: false, bubbles: true, composed: true }));
		this.dispatchEvent(new CustomEvent('food-select', { detail: food, bubbles: true, composed: true }));
	}

	private clearFoodSelection() {
		this.foodSearch = '';
		this.dispatchEvent(new CustomEvent('food-clear', { bubbles: true, composed: true }));
	}

	private onSearchBlur() {
		// 150ms allows @mousedown on dropdown items to fire before blur closes the list
		setTimeout(() => {
			if (this.foodDropdownOpen) {
				this.foodDropdownOpen = false;
				this.dispatchEvent(
					new CustomEvent('dropdown-toggle', { detail: false, bubbles: true, composed: true })
				);
			}
		}, 150);
	}

	private renderFoodDropdown() {
		const query = this.foodSearch.trim().toLowerCase();
		const userFoods = this.foods.filter(f => !f.isSystemProperty).sort((a, b) => a.name.localeCompare(b.name));
		const systemFoods = this.foods.filter(f => f.isSystemProperty).sort((a, b) => a.name.localeCompare(b.name));
		const pos = this.dropdownPos;
		const posStyle = pos
			? {
					'top': `${pos.top}px`,
					'left': `${pos.left}px`,
					'width': `${pos.width}px`,
					'max-height': `${pos.maxHeight}px`
				}
			: {};

		if (query) {
			const results = [...userFoods, ...systemFoods]
				.filter(f => f.name.toLowerCase().includes(query))
				.slice(0, 30);
			if (results.length === 0) {
				return html`
					<div class="food-dropdown" style=${styleMap(posStyle)}>
						<div class="food-dropdown-empty">Keine Ergebnisse für „${query}"</div>
					</div>
				`;
			}
			return html`<div class="food-dropdown" style=${styleMap(posStyle)}>
				${results.map(f => this.renderFoodOption(f))}
			</div>`;
		}

		// 5 personal + 10 system foods visible without search
		const visibleUser = userFoods.slice(0, 5);
		const visibleSystem = systemFoods.slice(0, 10);
		return html`
			<div class="food-dropdown" style=${styleMap(posStyle)}>
				${visibleUser.length > 0
					? html`
							<div class="food-dropdown-section">Meine Lebensmittel</div>
							${visibleUser.map(f => this.renderFoodOption(f))}
						`
					: ''}
				<div class="food-dropdown-section">Systemlebensmittel</div>
				${visibleSystem.map(f => this.renderFoodOption(f))}
			</div>
		`;
	}

	private renderFoodOption(food: Food) {
		const selected = food.id === this.selectedFoodId;
		return html`
			<button
				class="food-option ${selected ? 'selected' : ''}"
				type="button"
				@mousedown=${() => this.selectFood(food)}
			>
				<span class="food-option-name">${food.name}</span>
				<span class="food-option-kcal">${food.caloriesPer100g ?? 0} kcal/100g</span>
			</button>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-food-selector': FoodSelectorComponent;
	}
}
