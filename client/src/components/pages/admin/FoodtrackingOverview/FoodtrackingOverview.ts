/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import '../common/header/admin-header.js';
import '../common/nav/admin-nav.js';
import '../../../common/success-message/success-message.js';
import '../../../common/error-message/error-message.js';
import type { SuccessMessage } from '../../../common/success-message/success-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';
import './components/food-popup/FoodPopup.js';
import './components/food-edit-modal/FoodEditModal.js';
import './components/food-create-modal/FoodCreateModal.js';
import { requireAdminAuth } from '../common/admin-auth.js';
import { BASE_API } from '../../../../config.js';
import componentStyle from './FoodtrackingOverview.css?inline';
import { HttpClient, httpClientContext } from '../../../../http-client.js';
import type { SystemFood } from './admin-food.types.js';

type SortKey = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc';

const SORT_LABELS: Record<SortKey, string> = {
	'name-asc': 'A–Z',
	'name-desc': 'Z–A',
	'cal-asc': 'Kcal ↑',
	'cal-desc': 'Kcal ↓'
};

@customElement('admin-foodtracking')
export class AdminFoodtracking extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@query('success-message') private readonly successMsg!: SuccessMessage;
	@query('error-message') private readonly errorMsg!: ErrorMessage;

	@state() private foods: SystemFood[] = [];
	@state() private loading = true;
	@state() private error = '';
	@state() private search = '';
	@state() private sort: SortKey = 'name-asc';
	@state() private editFood: SystemFood | null = null;
	@state() private popupFoodId: string | null = null;
	@state() private confirmDeleteFood: SystemFood | null = null;
	@state() private showCreate = false;

	private get filteredFoods(): SystemFood[] {
		const q = this.search.toLowerCase();
		let list = this.foods.filter(f => f.name.toLowerCase().includes(q));
		if (this.sort === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
		else if (this.sort === 'name-desc') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
		else if (this.sort === 'cal-asc')
			list = [...list].sort((a, b) => (a.caloriesPer100g ?? 0) - (b.caloriesPer100g ?? 0)); // null calories sort to bottom
		else list = [...list].sort((a, b) => (b.caloriesPer100g ?? 0) - (a.caloriesPer100g ?? 0));
		return list;
	}

	override connectedCallback() {
		super.connectedCallback();
		void this.init();
	}

	render() {
		// Note: Parts of this render method were developed with the assistance of AI tools.
		return html`
			<admin-header></admin-header>
			<success-message></success-message>
			<error-message></error-message>
			<div class="page-header">
				<div class="controls">
					<div class="search-wrap">
						<svg class="search-icon" viewBox="0 0 20 20" fill="none">
							<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6" />
							<path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
						</svg>
						<input
							class="search-input"
							data-testid="foodtracking-search-input"
							type="text"
							placeholder="Lebensmittel suchen..."
							.value=${this.search}
							@input=${(e: Event) => (this.search = (e.target as HTMLInputElement).value)}
						/>
					</div>
					<button
						class="btn-new-food"
						data-testid="foodtracking-new-food-btn"
						@click=${() => (this.showCreate = true)}
					>
						+ Neues Lebensmittel
					</button>
					<div class="sort-pills" data-testid="foodtracking-sort-pills">
						${(['name-asc', 'name-desc', 'cal-asc', 'cal-desc'] as SortKey[]).map(
							key => html`
								<button
									class="sort-pill ${this.sort === key ? 'active' : ''}"
									data-testid="foodtracking-sort-${key}-btn"
									@click=${() => (this.sort = key)}
								>
									${SORT_LABELS[key]}
								</button>
							`
						)}
					</div>
				</div>
			</div>

			<div class="page-content">
				<div class="info-banner" role="note">
					<svg class="info-banner-icon" viewBox="0 0 20 20" fill="none">
						<circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5" />
						<path d="M10 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
						<circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
					</svg>
					<span class="info-banner-text"
						>Systemlebensmittel sind global verfügbar und für alle Nutzer sichtbar. Änderungen und
						Löschungen wirken sich auf alle Nutzer der App aus.</span
					>
				</div>
				${this.renderContent()}
			</div>

			${this.popupFoodId
				? html`<food-popup
						.foodId=${this.popupFoodId}
						data-testid="food-popup-element"
						@close=${() => (this.popupFoodId = null)}
					></food-popup>`
				: nothing}
			${this.renderConfirmDialog()}
			${this.editFood
				? html`<food-edit-modal
						.food=${this.editFood}
						@food-updated=${(e: CustomEvent<SystemFood>) => {
							this.foods = this.foods.map(f => (f.id === e.detail.id ? e.detail : f));
							this.editFood = null;
							this.successMsg.show(`"${e.detail.name}" wurde erfolgreich aktualisiert.`);
						}}
						@modal-close=${() => {
							this.editFood = null;
						}}
					></food-edit-modal>`
				: nothing}
			${this.showCreate
				? html`<food-create-modal
						@food-created=${(e: CustomEvent<SystemFood>) => {
							this.foods = [e.detail, ...this.foods];
							this.showCreate = false;
							this.successMsg.show(`"${e.detail.name}" wurde erfolgreich erstellt.`);
						}}
						@modal-close=${() => {
							this.showCreate = false;
						}}
					></food-create-modal>`
				: nothing}
			<admin-nav></admin-nav>
		`;
	}

	private async init() {
		if (!(await requireAdminAuth(this.http))) return;
		await this.loadFoods();
	}

	private async loadFoods() {
		try {
			const res = await this.http.get(`${BASE_API}/admin/foods`);
			if (!res.ok) throw new Error();
			this.foods = await res.json();
		} catch {
			this.error = 'Systemlebensmittel konnten nicht geladen werden.';
		} finally {
			this.loading = false;
		}
	}

	private openEdit(food: SystemFood) {
		this.editFood = { ...food }; // copy so edits don't mutate the list
	}

	private openDelete(food: SystemFood) {
		this.confirmDeleteFood = food;
	}

	private async confirmDelete() {
		const food = this.confirmDeleteFood;
		this.confirmDeleteFood = null;
		if (!food) return;
		try {
			const res = await this.http.delete(`${BASE_API}/admin/foods/${food.id}`);
			if (res.ok) {
				this.foods = this.foods.filter(f => f.id !== food.id); // optimistic removal — avoids a full reload
				this.successMsg.show(`"${food.name}" wurde erfolgreich gelöscht.`);
			} else {
				this.errorMsg.show('Systemlebensmittel konnte nicht gelöscht werden.');
			}
		} catch {
			this.errorMsg.show('Verbindungsfehler. Bitte versuche es erneut.');
		}
	}

	private renderContent() {
		if (this.loading) return html`<div class="loading" data-testid="foodtracking-loading">Laden...</div>`;
		if (this.error) return html`<div class="error-msg" data-testid="foodtracking-error-msg">${this.error}</div>`;
		return html`<div class="food-list" data-testid="foodtracking-food-list">${this.renderFoodList()}</div>`;
	}

	private renderFoodList() {
		if (this.filteredFoods.length === 0) {
			return html`<div class="empty" data-testid="foodtracking-empty-state">
				Keine Systemlebensmittel gefunden
			</div>`;
		}
		return this.filteredFoods.map(
			food => html`
				<div class="food-row" data-testid="foodtracking-food-row">
					<span class="food-name">${food.name}</span>
					<span class="food-calories">${food.caloriesPer100g ?? '—'} kcal</span>
					<span class="food-macros">
						Eiweiß: ${food.proteinPer100g ?? '—'}g | Fett: ${food.fatPer100g ?? '—'}g | Kohlenhydrate:
						${food.carbsPer100g ?? '—'}g
					</span>
					<div class="food-actions">
						<button
							class="btn btn-details"
							data-testid="foodtracking-food-details-btn"
							@click=${() => (this.popupFoodId = food.id)}
						>
							Details
						</button>
						<button
							class="btn btn-edit"
							data-testid="foodtracking-food-edit-btn"
							@click=${() => this.openEdit(food)}
						>
							Bearbeiten
						</button>
						<button
							class="btn btn-delete"
							data-testid="foodtracking-food-delete-btn"
							@click=${() => this.openDelete(food)}
						>
							Löschen
						</button>
					</div>
				</div>
			`
		);
	}

	private renderConfirmDialog() {
		if (!this.confirmDeleteFood) return nothing;
		const name = this.confirmDeleteFood.name;
		return html`
			<div class="confirm-overlay" data-testid="foodtracking-confirm-overlay">
				<div class="confirm-dialog">
					<p class="confirm-title" data-testid="foodtracking-confirm-title">"${name}" löschen?</p>
					<p class="confirm-message">Dieses Systemlebensmittel wird für alle Benutzer dauerhaft entfernt.</p>
					<div class="confirm-actions">
						<button
							class="confirm-btn confirm-btn--cancel"
							data-testid="foodtracking-confirm-cancel-btn"
							@click=${() => (this.confirmDeleteFood = null)}
						>
							Abbrechen
						</button>
						<button
							class="confirm-btn confirm-btn--delete"
							data-testid="foodtracking-confirm-delete-btn"
							@click=${() => void this.confirmDelete()}
						>
							Löschen
						</button>
					</div>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'admin-foodtracking': AdminFoodtracking;
	}
}
