/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type NewFoodFormData } from '../../../../food-tracking.types.js';
import componentStyle from './new-food-form.css?inline';

@customElement('my-new-food-form')
export class NewFoodFormComponent extends LitElement {
	static readonly styles = componentStyle;

	// set by the parent after a failed add attempt; widget clears it on the next name input
	@property({ type: Boolean }) nameEmpty = false;
	// number so repeated resets always produce a new value and trigger updated()
	@property({ type: Number }) resetKey = 0;

	@state() private name = '';
	@state() private calories = 0;
	@state() private caloriesEmpty = false;
	@state() private protein = 0;
	@state() private fat = 0;
	@state() private carbs = 0;

	private get macroOverLimit(): boolean {
		return this.protein + this.fat + this.carbs > 100;
	}

	private get hasNegativeNutrition(): boolean {
		return this.calories < 0 || this.protein < 0 || this.fat < 0 || this.carbs < 0;
	}

	override updated(changed: PropertyValues) {
		if (changed.has('resetKey') && changed.get('resetKey') !== undefined) {
			this.name = '';
			this.calories = 0;
			this.caloriesEmpty = false;
			this.protein = 0;
			this.fat = 0;
			this.carbs = 0;
		}
	}

	render() {
		const overLimit = this.macroOverLimit;

		return html`
			<div class="form-group">
				<label>Name</label>
				<input
					class="form-input ${this.nameEmpty ? 'input-error' : ''}"
					type="text"
					placeholder=${this.nameEmpty ? 'Bitte einen Namen eingeben.' : 'z. B. Hähnchenbrust'}
					.value=${this.name}
					@input=${(e: Event) => {
						this.name = (e.target as HTMLInputElement).value;
						this.emit();
					}}
				/>
			</div>
			<div class="form-row">
				<div class="form-group">
					<label>Kalorien / 100g</label>
					<input
						class="form-input ${this.caloriesEmpty || this.calories < 0 ? 'input-error' : ''}"
						type="number"
						min="0"
						.value=${String(this.calories)}
						@input=${(e: Event) => {
							const val = (e.target as HTMLInputElement).value;
							this.caloriesEmpty = val === '';
							this.calories = Number(val);
							this.emit();
						}}
					/>
				</div>
				<div class="form-group">
					<label>Eiweiß / 100g</label>
					<input
						class="form-input ${overLimit || this.protein < 0 ? 'input-error' : ''}"
						type="number"
						min="0"
						.value=${String(this.protein)}
						@input=${(e: Event) => {
							this.protein = Number((e.target as HTMLInputElement).value);
							this.emit();
						}}
						@blur=${(e: Event) => {
							const input = e.target as HTMLInputElement;
							if (input.value === '') input.value = '0';
						}}
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-group">
					<label>Fett / 100g</label>
					<input
						class="form-input ${overLimit || this.fat < 0 ? 'input-error' : ''}"
						type="number"
						min="0"
						.value=${String(this.fat)}
						@input=${(e: Event) => {
							this.fat = Number((e.target as HTMLInputElement).value);
							this.emit();
						}}
						@blur=${(e: Event) => {
							const input = e.target as HTMLInputElement;
							if (input.value === '') input.value = '0';
						}}
					/>
				</div>
				<div class="form-group">
					<label>Kohlenhydrate / 100g</label>
					<input
						class="form-input ${overLimit || this.carbs < 0 ? 'input-error' : ''}"
						type="number"
						min="0"
						.value=${String(this.carbs)}
						@input=${(e: Event) => {
							this.carbs = Number((e.target as HTMLInputElement).value);
							this.emit();
						}}
						@blur=${(e: Event) => {
							const input = e.target as HTMLInputElement;
							if (input.value === '') input.value = '0';
						}}
					/>
				</div>
			</div>
			${this.caloriesEmpty ? html`<div class="over-limit-hint">Kalorien sind erforderlich.</div>` : ''}
			${this.hasNegativeNutrition
				? html`<div class="over-limit-hint">Nährwerte dürfen nicht negativ sein.</div>`
				: ''}
			${overLimit
				? html`<div class="over-limit-hint">Eiweiß + Fett + Kohlenhydrate übersteigen 100g / 100g</div>`
				: ''}
		`;
	}

	private emit() {
		this.dispatchEvent(
			new CustomEvent<NewFoodFormData>('new-food-change', {
				detail: {
					name: this.name,
					calories: this.calories,
					caloriesEmpty: this.caloriesEmpty,
					protein: this.protein,
					fat: this.fat,
					carbs: this.carbs,
					macroOverLimit: this.macroOverLimit,
					hasNegativeNutrition: this.hasNegativeNutrition
				},
				bubbles: true,
				composed: true
			})
		);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-new-food-form': NewFoodFormComponent;
	}
}
