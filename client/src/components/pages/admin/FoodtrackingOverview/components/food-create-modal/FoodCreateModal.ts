/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import componentStyle from './FoodCreateModal.css?inline';
import { BASE_API } from '../../../../../../config.js';
import type { SystemFood } from '../../admin-food.types.js';

@customElement('food-create-modal')
export class FoodCreateModal extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private name = '';
	@state() private nameEmpty = false;
	@state() private calories = 0;
	@state() private caloriesEmpty = false;
	@state() private protein = 0;
	@state() private fat = 0;
	@state() private carbs = 0;
	@state() private error = '';
	@state() private saving = false;

	private get hasNegativeNutrition(): boolean {
		// calories has a separate required-check; this only catches negative values
		return this.calories < 0 || this.protein < 0 || this.fat < 0 || this.carbs < 0;
	}

	render() {
		const overLimit = this.protein + this.fat + this.carbs > 100;
		return html`
			<div class="edit-overlay" data-testid="foodtracking-create-overlay">
				<div class="edit-modal">
					<div class="edit-header">
						<h2 class="edit-title">Neues Systemlebensmittel</h2>
						<button class="edit-close" @click=${() => this.close()}>✕</button>
					</div>
					<div class="edit-body">
						${this.error
							? html`<div class="edit-error" data-testid="foodtracking-create-error">${this.error}</div>`
							: ''}
						<div class="form-group">
							<label class="form-label" for="create-name">Name</label>
							<input
								class="form-input ${this.nameEmpty ? 'input-error' : ''}"
								id="create-name"
								type="text"
								placeholder=${this.nameEmpty ? 'Bitte einen Namen eingeben.' : ''}
								.value=${this.name}
								@input=${(e: Event) => {
									this.name = (e.target as HTMLInputElement).value;
									this.nameEmpty = false;
								}}
								data-testid="foodtracking-create-name"
							/>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="create-calories">Kalorien / 100g</label>
								<input
									class="form-input ${this.caloriesEmpty || this.calories < 0 ? 'input-error' : ''}"
									id="create-calories"
									type="number"
									min="0"
									.value=${this.calories.toString()}
									@input=${(e: Event) => {
										const val = (e.target as HTMLInputElement).value;
										this.caloriesEmpty = val === '';
										this.calories = Number(val);
									}}
									data-testid="foodtracking-create-calories"
								/>
							</div>
							<div class="form-group">
								<label class="form-label" for="create-protein">Eiweiß / 100g</label>
								<input
									class="form-input ${overLimit || this.protein < 0 ? 'input-error' : ''}"
									id="create-protein"
									type="number"
									min="0"
									.value=${this.protein.toString()}
									@input=${(e: Event) => {
										this.protein = Number((e.target as HTMLInputElement).value);
									}}
									@blur=${(e: Event) => {
										const input = e.target as HTMLInputElement;
										if (input.value === '') input.value = '0';
									}}
									data-testid="foodtracking-create-protein"
								/>
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="create-fat">Fett / 100g</label>
								<input
									class="form-input ${overLimit || this.fat < 0 ? 'input-error' : ''}"
									id="create-fat"
									type="number"
									min="0"
									.value=${this.fat.toString()}
									@input=${(e: Event) => {
										this.fat = Number((e.target as HTMLInputElement).value);
									}}
									@blur=${(e: Event) => {
										const input = e.target as HTMLInputElement;
										if (input.value === '') input.value = '0';
									}}
									data-testid="foodtracking-create-fat"
								/>
							</div>
							<div class="form-group">
								<label class="form-label" for="create-carbs">Kohlenhydrate / 100g</label>
								<input
									class="form-input ${overLimit || this.carbs < 0 ? 'input-error' : ''}"
									id="create-carbs"
									type="number"
									min="0"
									.value=${this.carbs.toString()}
									@input=${(e: Event) => {
										this.carbs = Number((e.target as HTMLInputElement).value);
									}}
									@blur=${(e: Event) => {
										const input = e.target as HTMLInputElement;
										if (input.value === '') input.value = '0';
									}}
									data-testid="foodtracking-create-carbs"
								/>
							</div>
						</div>
						${this.caloriesEmpty
							? html`<div class="over-limit-hint" data-testid="foodtracking-create-calories-empty">
									Kalorien sind erforderlich.
								</div>`
							: ''}
						${this.hasNegativeNutrition
							? html`<div class="over-limit-hint" data-testid="foodtracking-create-negative">
									Nährwerte dürfen nicht negativ sein.
								</div>`
							: ''}
						${overLimit
							? html`<div class="over-limit-hint" data-testid="foodtracking-create-over-limit">
									Eiweiß + Fett + Kohlenhydrate übersteigen 100g / 100g
								</div>`
							: ''}
						<button
							class="btn-save"
							data-testid="foodtracking-create-save-btn"
							?disabled=${this.saving || this.caloriesEmpty || overLimit || this.hasNegativeNutrition}
							@click=${() => void this.save()}
						>
							${this.saving ? 'Speichern…' : 'Lebensmittel erstellen'}
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private async save() {
		if (!this.name.trim()) {
			this.nameEmpty = true;
			return;
		}
		if (this.protein + this.fat + this.carbs > 100) {
			this.error = 'Eiweiß + Fett + Kohlenhydrate dürfen 100g pro 100g nicht überschreiten.';
			return;
		}
		this.saving = true;
		this.error = '';
		try {
			const res = await this.http.post(`${BASE_API}/admin/foods`, {
				name: this.name.trim(),
				caloriesPer100g: this.calories,
				proteinPer100g: this.protein,
				fatPer100g: this.fat,
				carbsPer100g: this.carbs
			});
			if (!res.ok) {
				const err = (await res.json().catch(() => ({}))) as { detail?: string }; // catch non-JSON error bodies
				this.error = err.detail ?? 'Lebensmittel konnte nicht erstellt werden.';
				return;
			}
			const created: SystemFood = await res.json();
			this.dispatchEvent(
				new CustomEvent<SystemFood>('food-created', { detail: created, bubbles: true, composed: true })
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
		'food-create-modal': FoodCreateModal;
	}
}
