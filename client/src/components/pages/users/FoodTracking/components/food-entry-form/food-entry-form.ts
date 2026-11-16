/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import componentStyle from './food-entry-form.css?inline';
import {
	type Food,
	type MealType,
	type PendingFoodItem,
	type NewFoodFormData,
	getTodayMs
} from '../../food-tracking.types.js';
import foodEntryService from './food-entry.service.js';
import './components/meal-type-selector/meal-type-selector.js';
import './components/macro-preview/macro-preview.js';
import './components/food-item-list/food-item-list.js';
import './components/pending-confirm/pending-confirm.js';
import './components/new-food-form/new-food-form.js';
import './components/food-selector/food-selector.js';

// shared between initial state and post-add reset to keep defaults in one place
const defaultNewFood: NewFoodFormData = {
	name: '',
	calories: 0,
	caloriesEmpty: false,
	protein: 0,
	fat: 0,
	carbs: 0,
	macroOverLimit: false,
	hasNegativeNutrition: false
};

@customElement('my-food-entry-form')
export class FoodEntryFormComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: Array }) availableFoods: Food[] = [];
	@property({ type: String }) userId = '';

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private formMealType: MealType = 'breakfast';
	@state() private formMode: 'existing' | 'new' = 'existing';
	@state() private formFoodId = '';
	@state() private formQuantity = 100;
	@state() private formError: string | null = null;
	@state() private saving = false;
	@state() private pendingItems: PendingFoodItem[] = [];
	@state() private showPendingConfirm = false;
	@state() private foodDropdownOpen = false;
	@state() private newFood: NewFoodFormData = { ...defaultNewFood };
	@state() private newFoodNameEmpty = false;
	@state() private newFoodResetKey = 0;
	@state() private foodSelectorResetKey = 0;

	private get quantityNegative(): boolean {
		return this.formQuantity < 0;
	}

	private get hasPendingInput(): boolean {
		if (this.formMode === 'existing') return this.formFoodId !== '';
		return this.newFood.name.trim() !== '';
	}

	private get pendingFoodName(): string {
		if (this.formMode === 'existing') {
			return this.availableFoods.find(f => f.id === this.formFoodId)?.name ?? this.formFoodId;
		}
		return this.newFood.name.trim();
	}

	private get previewNutrition(): { calories: number; protein: number; fat: number; carbs: number } {
		if (this.formMode === 'new') {
			return {
				calories: this.newFood.calories,
				protein: this.newFood.protein,
				fat: this.newFood.fat,
				carbs: this.newFood.carbs
			};
		}
		const food = this.availableFoods.find(f => f.id === this.formFoodId);
		return {
			calories: food?.caloriesPer100g ?? 0,
			protein: food?.proteinPer100g ?? 0,
			fat: food?.fatPer100g ?? 0,
			carbs: food?.carbsPer100g ?? 0
		};
	}

	private get addButtonDisabled(): boolean {
		if (this.saving || this.quantityNegative) return true;
		if (this.formMode !== 'new') return false;
		return this.newFood.caloriesEmpty || this.newFood.macroOverLimit || this.newFood.hasNegativeNutrition;
	}

	override connectedCallback() {
		super.connectedCallback();
		// prevent scroll-chaining to the page while the modal is open
		document.documentElement.style.overscrollBehavior = 'none';
		document.body.style.overscrollBehavior = 'none';
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		document.documentElement.style.overscrollBehavior = '';
		document.body.style.overscrollBehavior = '';
	}

	render() {
		const preview = this.previewNutrition;
		// Note: Parts of this render method were developed with the assistance of AI tools.
		return html`
			<div
				class="modal-overlay"
				@click=${(e: Event) => {
					if (e.target === e.currentTarget) this.close();
				}}
			>
				<div class="modal ${this.foodDropdownOpen ? 'dropdown-open' : ''}" data-testid="food-entry-form">
					<div class="modal-header">
						<h2>Mahlzeit hinzufügen</h2>
						<button class="modal-close" @click=${() => this.close()} type="button">✕</button>
					</div>
					<div class="modal-body">
						<my-meal-type-selector
							.mealType=${this.formMealType}
							@meal-type-change=${(e: CustomEvent<MealType>) => {
								this.formMealType = e.detail;
							}}
						></my-meal-type-selector>
						<div class="mode-toggle">
							<button
								class="mode-btn ${this.formMode === 'existing' ? 'active' : ''}"
								@click=${() => {
									this.formMode = 'existing';
									// widget is destroyed on mode switch so no dropdown-toggle fires; reset manually
									this.foodDropdownOpen = false;
								}}
								type="button"
							>
								Vorhandenes Lebensmittel
							</button>
							<button
								class="mode-btn ${this.formMode === 'new' ? 'active' : ''}"
								@click=${() => {
									this.formMode = 'new';
									this.foodDropdownOpen = false;
								}}
								type="button"
							>
								Neues Lebensmittel
							</button>
						</div>
						${this.formMode === 'existing'
							? html`<my-food-selector
									.foods=${this.availableFoods}
									.selectedFoodId=${this.formFoodId}
									.resetKey=${this.foodSelectorResetKey}
									@food-select=${(e: CustomEvent<Food>) => {
										this.formFoodId = e.detail.id;
										this.showPendingConfirm = false;
									}}
									@food-clear=${() => {
										this.formFoodId = '';
										this.showPendingConfirm = false;
									}}
									@dropdown-toggle=${(e: CustomEvent<boolean>) => {
										this.foodDropdownOpen = e.detail;
									}}
								></my-food-selector>`
							: html`<my-new-food-form
									.nameEmpty=${this.newFoodNameEmpty}
									.resetKey=${this.newFoodResetKey}
									@new-food-change=${(e: CustomEvent<NewFoodFormData>) => {
										this.newFood = e.detail;
										this.newFoodNameEmpty = false;
										this.showPendingConfirm = false;
									}}
								></my-new-food-form>`}
						${this.showPendingConfirm && this.hasPendingInput
							? html`<my-pending-confirm
									.foodName=${this.pendingFoodName}
									@confirm-and-save=${() => this.confirmAddAndSave()}
								></my-pending-confirm>`
							: ''}
						<div class="form-group">
							<label>Menge (g)</label>
							<input
								class="form-input ${this.quantityNegative ? 'input-error' : ''}"
								type="number"
								min="1"
								data-testid="food-entry-quantity"
								.value=${String(this.formQuantity)}
								@input=${(e: Event) => {
									this.formQuantity = Number((e.target as HTMLInputElement).value);
								}}
							/>
							${this.quantityNegative
								? html`<span class="over-limit-hint" data-testid="food-entry-quantity-hint"
										>Die Menge darf nicht negativ sein.</span
									>`
								: ''}
						</div>
						${this.formMode === 'new' || this.formFoodId
							? html`<my-macro-preview
									.quantity=${this.formQuantity}
									.calories=${preview.calories}
									.protein=${preview.protein}
									.fat=${preview.fat}
									.carbs=${preview.carbs}
									.overLimit=${this.formMode === 'new' && this.newFood.macroOverLimit}
								></my-macro-preview>`
							: ''}
						<button
							class="btn-add"
							data-testid="food-entry-add-btn"
							@click=${() => this.addItem()}
							?disabled=${this.addButtonDisabled}
							type="button"
						>
							+ Hinzufügen
						</button>
						<my-food-item-list
							.items=${this.pendingItems}
							.saving=${this.saving}
							@item-removed=${(e: CustomEvent<number>) => this.removeItem(e.detail)}
						></my-food-item-list>
						${this.formError ? html`<div class="form-error">${this.formError}</div>` : ''}
						<button
							class="btn-save"
							data-testid="food-entry-save-btn"
							@click=${() => void this.handleSave()}
							?disabled=${this.saving || this.pendingItems.length === 0}
							type="button"
						>
							${this.saving ? 'Speichern…' : 'Mahlzeit speichern'}
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private close() {
		this.dispatchEvent(new CustomEvent('form-close', { bubbles: true, composed: true }));
	}

	private addItem() {
		this.formError = null;
		if (this.formMode === 'existing' && !this.formFoodId) {
			this.formError = 'Bitte ein Lebensmittel auswählen.';
			return;
		}
		if (this.formMode === 'new' && !this.newFood.name.trim()) {
			this.newFoodNameEmpty = true;
			return;
		}
		if (this.formQuantity <= 0) {
			this.formError = 'Die Menge muss größer als 0 sein.';
			return;
		}

		const existingFood = this.availableFoods.find(f => f.id === this.formFoodId);
		const item: PendingFoodItem =
			this.formMode === 'existing'
				? {
						mode: 'existing',
						displayName: existingFood?.name ?? this.formFoodId,
						quantityGrams: this.formQuantity,
						foodId: this.formFoodId,
						caloriesPer100g: existingFood?.caloriesPer100g ?? 0
					}
				: {
						mode: 'new',
						displayName: this.newFood.name.trim(),
						quantityGrams: this.formQuantity,
						caloriesPer100g: this.newFood.calories,
						proteinPer100g: this.newFood.protein,
						fatPer100g: this.newFood.fat,
						carbsPer100g: this.newFood.carbs
					};

		this.pendingItems = [...this.pendingItems, item];
		this.formFoodId = '';
		this.formQuantity = 100;
		this.newFood = { ...defaultNewFood };
		this.newFoodNameEmpty = false;
		this.newFoodResetKey++;
		this.foodSelectorResetKey++;
	}

	private removeItem(index: number) {
		this.pendingItems = this.pendingItems.filter((_, i) => i !== index);
	}

	private async handleSave() {
		if (this.saving) return;

		if (this.hasPendingInput && !this.showPendingConfirm) {
			this.showPendingConfirm = true;
			return;
		}

		this.showPendingConfirm = false;
		this.formError = null;

		if (this.pendingItems.length === 0) {
			this.formError = 'Bitte mindestens ein Lebensmittel hinzufügen.';
			return;
		}

		this.saving = true;
		try {
			const entryId = await foodEntryService.createMealEntry(
				this.http,
				this.userId,
				this.formMealType,
				getTodayMs()
			);
			if (!entryId) {
				this.formError = 'Mahlzeiteintrag konnte nicht erstellt werden.';
				return;
			}

			const failedItem = await foodEntryService.saveItems(this.http, entryId, this.userId, this.pendingItems);
			if (failedItem !== null) {
				// roll back the meal entry so no orphaned record is left in the DB
				await foodEntryService.rollbackEntry(this.http, this.userId, entryId);
				this.formError = `„${failedItem}" konnte nicht hinzugefügt werden. Die Mahlzeit wurde nicht gespeichert.`;
				return;
			}

			this.dispatchEvent(new CustomEvent('food-saved', { bubbles: true, composed: true }));
		} catch {
			this.formError = 'Verbindungsfehler. Bitte versuche es erneut.';
		} finally {
			this.saving = false;
		}
	}

	private confirmAddAndSave() {
		const before = this.pendingItems.length;
		this.addItem();
		this.showPendingConfirm = false;
		if (this.pendingItems.length > before) {
			void this.handleSave();
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-food-entry-form': FoodEntryFormComponent;
	}
}
