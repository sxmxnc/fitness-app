/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, nothing, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import componentStyle from './FoodEditModal.css?inline';
import { BASE_API } from '../../../../../../config.js';
import type { SystemFood } from '../../admin-food.types.js';

@customElement('food-edit-modal')
export class FoodEditModal extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: Object }) food: SystemFood | null = null;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private saving = false;
	@state() private error = '';
	@state() private nameEmpty = false;
	@state() private caloriesEmpty = false;
	@state() private caloriesNeg = false;
	@state() private proteinNeg = false;
	@state() private fatNeg = false;
	@state() private carbsNeg = false;
	@state() private proteinVal = 0;
	@state() private fatVal = 0;
	@state() private carbsVal = 0;

	@query('#edit-name') private readonly nameInput!: HTMLInputElement;
	@query('#edit-calories') private readonly caloriesInput!: HTMLInputElement;
	@query('#edit-protein') private readonly proteinInput!: HTMLInputElement;
	@query('#edit-fat') private readonly fatInput!: HTMLInputElement;
	@query('#edit-carbs') private readonly carbsInput!: HTMLInputElement;

	private get overLimit(): boolean {
		// macros are per 100g, so the sum can't exceed 100
		return this.proteinVal + this.fatVal + this.carbsVal > 100;
	}

	private get hasNegativeNutrition(): boolean {
		return this.caloriesNeg || this.proteinNeg || this.fatNeg || this.carbsNeg;
	}

	override willUpdate(changedProps: PropertyValues) {
		// re-sync validation state whenever the food prop is replaced
		if (changedProps.has('food') && this.food) {
			this.caloriesEmpty = this.food.caloriesPer100g == null;
			this.proteinVal = this.food.proteinPer100g ?? 0;
			this.fatVal = this.food.fatPer100g ?? 0;
			this.carbsVal = this.food.carbsPer100g ?? 0;
		}
	}

	render() {
		const f = this.food;
		if (!f) return nothing;
		// Note: Parts of this render method were developed with the assistance of AI tools.
		return html`
			<div class="edit-overlay" data-testid="foodtracking-edit-overlay">
				<div class="edit-modal">
					<div class="edit-header">
						<h2 class="edit-title">Systemlebensmittel bearbeiten</h2>
						<button class="edit-close" @click=${() => this.close()}>✕</button>
					</div>
					<div class="edit-body">
						${this.error
							? html`<div class="edit-error" data-testid="foodtracking-edit-error">${this.error}</div>`
							: ''}
						<div class="form-group">
							<label class="form-label" for="edit-name">Name</label>
							<input
								class="form-input ${this.nameEmpty ? 'input-error' : ''}"
								id="edit-name"
								type="text"
								placeholder=${this.nameEmpty ? 'Bitte einen Namen eingeben.' : ''}
								.value=${f.name}
								@input=${() => {
									this.nameEmpty = false;
								}}
								data-testid="foodtracking-edit-name"
							/>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="edit-calories">Kalorien / 100g</label>
								<input
									class="form-input ${this.caloriesEmpty || this.caloriesNeg ? 'input-error' : ''}"
									id="edit-calories"
									type="number"
									min="0"
									.value=${f.caloriesPer100g?.toString() ?? ''}
									@input=${(e: Event) => {
										const val = (e.target as HTMLInputElement).value;
										this.caloriesEmpty = val === '';
										this.caloriesNeg = val !== '' && Number(val) < 0;
									}}
									data-testid="foodtracking-edit-calories"
								/>
							</div>
							<div class="form-group">
								<label class="form-label" for="edit-protein">Eiweiß / 100g</label>
								<input
									class="form-input ${this.overLimit || this.proteinNeg ? 'input-error' : ''}"
									id="edit-protein"
									type="number"
									min="0"
									.value=${f.proteinPer100g?.toString() ?? ''}
									@input=${(e: Event) => {
										const v = Number((e.target as HTMLInputElement).value);
										this.proteinNeg = v < 0;
										this.proteinVal = v;
									}}
									@blur=${(e: Event) => {
										const input = e.target as HTMLInputElement;
										if (input.value === '') input.value = '0';
									}}
									data-testid="foodtracking-edit-protein"
								/>
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="edit-fat">Fett / 100g</label>
								<input
									class="form-input ${this.overLimit || this.fatNeg ? 'input-error' : ''}"
									id="edit-fat"
									type="number"
									min="0"
									.value=${f.fatPer100g?.toString() ?? ''}
									@input=${(e: Event) => {
										const v = Number((e.target as HTMLInputElement).value);
										this.fatNeg = v < 0;
										this.fatVal = v;
									}}
									@blur=${(e: Event) => {
										const input = e.target as HTMLInputElement;
										if (input.value === '') input.value = '0';
									}}
									data-testid="foodtracking-edit-fat"
								/>
							</div>
							<div class="form-group">
								<label class="form-label" for="edit-carbs">Kohlenhydrate / 100g</label>
								<input
									class="form-input ${this.overLimit || this.carbsNeg ? 'input-error' : ''}"
									id="edit-carbs"
									type="number"
									min="0"
									.value=${f.carbsPer100g?.toString() ?? ''}
									@input=${(e: Event) => {
										const v = Number((e.target as HTMLInputElement).value);
										this.carbsNeg = v < 0;
										this.carbsVal = v;
									}}
									@blur=${(e: Event) => {
										const input = e.target as HTMLInputElement;
										if (input.value === '') input.value = '0';
									}}
									data-testid="foodtracking-edit-carbs"
								/>
							</div>
						</div>
						${this.caloriesEmpty
							? html`<div class="over-limit-hint" data-testid="foodtracking-edit-calories-empty">
									Kalorien sind erforderlich.
								</div>`
							: ''}
						${this.hasNegativeNutrition
							? html`<div class="over-limit-hint" data-testid="foodtracking-edit-negative">
									Nährwerte dürfen nicht negativ sein.
								</div>`
							: ''}
						${this.overLimit
							? html`<div class="over-limit-hint" data-testid="foodtracking-edit-over-limit">
									Eiweiß + Fett + Kohlenhydrate übersteigen 100g / 100g
								</div>`
							: ''}
						<button
							class="btn-save"
							data-testid="foodtracking-edit-save-btn"
							?disabled=${this.saving ||
							this.caloriesEmpty ||
							this.hasNegativeNutrition ||
							this.overLimit}
							@click=${() => void this.save()}
						>
							${this.saving ? 'Speichern…' : 'Änderungen speichern'}
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private async save() {
		if (!this.food) return;

		const name = this.nameInput.value.trim();
		const calories = this.caloriesInput.value;
		const protein = this.proteinInput.value;
		const fat = this.fatInput.value;
		const carbs = this.carbsInput.value;

		if (!name) {
			this.nameEmpty = true;
			return;
		}

		// calories is optional (null = unknown); macros default to 0 when left empty
		const body = {
			name,
			caloriesPer100g: calories === '' ? null : Number(calories),
			proteinPer100g: protein === '' ? 0 : Number(protein),
			fatPer100g: fat === '' ? 0 : Number(fat),
			carbsPer100g: carbs === '' ? 0 : Number(carbs)
		};

		this.saving = true;
		this.error = '';
		try {
			const res = await this.http.patch(`${BASE_API}/admin/foods/${this.food.id}`, body);
			if (!res.ok) {
				const err = (await res.json().catch(() => ({}))) as { detail?: string };
				this.error = err.detail ?? 'Änderungen konnten nicht gespeichert werden.';
				return;
			}
			const updated: SystemFood = await res.json();
			this.dispatchEvent(
				new CustomEvent<SystemFood>('food-updated', { detail: updated, bubbles: true, composed: true })
			);
		} catch {
			this.error = 'Verbindungsfehler. Bitte versuche es erneut.';
		} finally {
			this.saving = false;
		}
	}

	private close() {
		this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'food-edit-modal': FoodEditModal;
	}
}
