/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import { BASE_API } from '../../../../../../config.js';
import componentStyle from './FoodPopup.css?inline';
import type { SystemFood } from '../../admin-food.types.js';

@customElement('food-popup')
export class FoodPopup extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: String }) foodId: string | null = null;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private food: SystemFood | null = null;
	@state() private loading = false;
	@state() private error = '';

	override updated(changedProps: PropertyValues) {
		// reload whenever the parent sets a new foodId
		if (changedProps.has('foodId') && this.foodId) {
			void this.loadFood(this.foodId);
		}
	}

	render() {
		if (!this.foodId) return nothing;
		return html`
			<div
				class="overlay"
				data-testid="food-popup-overlay"
				@click=${(e: Event) => e.target === e.currentTarget && this.close()}
			>
				<div class="popup" data-testid="food-popup">
					<div class="popup-header">
						<span class="popup-name" data-testid="food-popup-name">${this.food?.name ?? '—'}</span>
						<button class="popup-close" data-testid="food-popup-close-btn" @click=${() => this.close()}>
							<svg viewBox="0 0 20 20" fill="none">
								<path
									d="M5 5l10 10M15 5L5 15"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
								/>
							</svg>
						</button>
					</div>

					${this.loading
						? html`<div class="popup-loading" data-testid="food-popup-loading">Laden...</div>`
						: this.renderBody()}
				</div>
			</div>
		`;
	}

	private renderBody() {
		if (this.error) {
			return html`<div class="popup-error" data-testid="food-popup-error">${this.error}</div>`;
		}
		return html`
			<div class="popup-grid" data-testid="food-popup-grid">
				<div class="stat-card" data-testid="food-popup-stat-calories">
					<span class="stat-label">Kalorien / 100g</span>
					<span class="stat-value">${this.fmt(this.food?.caloriesPer100g ?? null, ' kcal')}</span>
				</div>
				<div class="stat-card" data-testid="food-popup-stat-protein">
					<span class="stat-label">Eiweiß / 100g</span>
					<span class="stat-value">${this.fmt(this.food?.proteinPer100g ?? null, ' g')}</span>
				</div>
				<div class="stat-card" data-testid="food-popup-stat-fat">
					<span class="stat-label">Fett / 100g</span>
					<span class="stat-value">${this.fmt(this.food?.fatPer100g ?? null, ' g')}</span>
				</div>
				<div class="stat-card" data-testid="food-popup-stat-carbs">
					<span class="stat-label">Kohlenhydrate / 100g</span>
					<span class="stat-value">${this.fmt(this.food?.carbsPer100g ?? null, ' g')}</span>
				</div>
			</div>
		`;
	}

	private async loadFood(id: string) {
		this.loading = true;
		this.error = '';
		this.food = null;
		try {
			const res = await this.http.get(`${BASE_API}/admin/foods/${id}`);
			if (!res.ok) throw new Error();
			this.food = (await res.json()) as SystemFood;
		} catch {
			this.error = 'Lebensmitteldetails konnten nicht geladen werden.';
		} finally {
			this.loading = false;
		}
	}

	private close() {
		this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
	}

	private fmt(value: number | null, unit = '') {
		return value != null ? `${value}${unit}` : '—';
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'food-popup': FoodPopup;
	}
}
