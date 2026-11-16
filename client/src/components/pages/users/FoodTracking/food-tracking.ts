/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { Router, routerContext } from '../../../../router.js';
import { HttpClient, httpClientContext } from '../../../../http-client.js';
import '../common/user-header/user-header.js';
import '../common/user-nav/user-nav.js';
import '../../../common/success-message/success-message.js';
import '../../../common/error-message/error-message.js';
import type { SuccessMessage } from '../../../common/success-message/success-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';
import './components/food-summary-card/food-summary-card.js';
import './components/food-entry-list/food-entry-list.js';
import './components/food-entry-form/food-entry-form.js';
import componentStyle from './food-tracking.css?inline';
import { BASE_API } from '../../../../config.js';
import {
	type Food,
	type MealEntry,
	type MealEntryFoodWithNutrition,
	type SummaryData,
	type Period,
	getTodayMs
} from './food-tracking.types.js';

@customElement('app-foodtracking')
export class FoodTrackingComponent extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;
	@consume({ context: routerContext }) private readonly router!: Router;

	@query('success-message') private readonly successMsg!: SuccessMessage;
	@query('error-message') private readonly errorMsg!: ErrorMessage;

	@state() private entries: MealEntry[] = [];
	@state() private entryFoodsMap: Map<string, MealEntryFoodWithNutrition[]> = new Map();
	@state() private availableFoods: Food[] = [];
	@state() private summary: SummaryData | null = null;
	@state() private calorieGoal: number | null = null;
	@state() private proteinGoal: number | null = null;
	@state() private period: Period = 'daily';
	@state() private loading = true;
	@state() private error: string | null = null;
	@state() private showForm = false;
	@state() private confirmDeleteEntryId: string | null = null;

	private get userId(): string {
		return localStorage.getItem('userId') ?? '';
	}

	private get currentYear(): number {
		return new Date().getFullYear();
	}

	override connectedCallback() {
		super.connectedCallback();
		void this.init();
	}

	render() {
		return html`
			<app-header></app-header>
			<success-message></success-message>
			<error-message></error-message>
			<div class="page-content ${this.showForm ? 'modal-open' : ''}">${this.renderContent()}</div>
			<button
				class="fab"
				@click=${() => {
					this.showForm = true;
				}}
				type="button"
			>
				+ Mahlzeit hinzufügen
			</button>
			${this.showForm
				? html`
						<my-food-entry-form
							.availableFoods=${this.availableFoods}
							.userId=${this.userId}
							@food-saved=${() => {
								this.showForm = false;
								void this.loadData();
								this.successMsg.show('Mahlzeit wurde erfolgreich gespeichert.');
							}}
							@form-close=${() => {
								this.showForm = false;
							}}
						></my-food-entry-form>
					`
				: ''}
			${this.renderConfirmDialog()}
			<app-nav></app-nav>
		`;
	}

	private async loadData() {
		this.loading = true;
		this.error = null;
		try {
			const id = this.userId;
			const summaryUrl =
				this.period === 'yearly'
					? `${BASE_API}/food/${id}/summary?period=yearly&year=${this.currentYear}`
					: `${BASE_API}/food/${id}/summary?period=${this.period}&date=${getTodayMs()}`;

			const [summaryRes, foodsRes, userDataRes] = await Promise.all([
				this.http.get(summaryUrl),
				this.http.get(`${BASE_API}/food/${id}/foods`),
				this.http.get(`${BASE_API}/users/data/${id}`)
			]);

			if (!summaryRes.ok || !foodsRes.ok) {
				this.error = 'Daten konnten nicht geladen werden.';
				return;
			}

			this.summary = await summaryRes.json();
			this.availableFoods = await foodsRes.json();
			if (userDataRes.ok) {
				const userData = (await userDataRes.json()) as {
					dailyCalorieGoal?: number;
					dailyProteinGoal?: number;
				};
				this.calorieGoal = userData.dailyCalorieGoal ?? null;
				this.proteinGoal = userData.dailyProteinGoal ?? null;
			}

			// meal-detail list is only rendered in daily view
			if (this.period === 'daily') {
				// single request – server returns entries with foods inline (no N+1)
				const entriesRes = await this.http.get(`${BASE_API}/food/${id}/entries?date=${getTodayMs()}`);
				if (!entriesRes.ok) {
					this.error = 'Daten konnten nicht geladen werden.';
					return;
				}
				const entriesWithFoods: (MealEntry & { foods: MealEntryFoodWithNutrition[] })[] =
					await entriesRes.json();
				this.entries = entriesWithFoods;
				this.entryFoodsMap = new Map(entriesWithFoods.map(e => [e.id, e.foods]));
			} else {
				this.entries = [];
				this.entryFoodsMap = new Map();
			}
		} catch {
			this.error = 'Verbindungsfehler. Bitte versuche es erneut.';
		} finally {
			this.loading = false;
		}
	}

	private handleEntryDelete(entryId: string) {
		this.confirmDeleteEntryId = entryId;
	}

	private async confirmDelete() {
		const entryId = this.confirmDeleteEntryId;
		this.confirmDeleteEntryId = null; // dismiss dialog immediately; error shown inline if request fails
		if (!entryId) return;
		try {
			const res = await this.http.delete(`${BASE_API}/food/${this.userId}/entries/${entryId}`);
			if (res.ok) {
				await this.loadData();
				this.successMsg.show('Eintrag wurde erfolgreich gelöscht.');
			} else {
				this.errorMsg.show('Eintrag konnte nicht gelöscht werden.');
			}
		} catch {
			this.errorMsg.show('Verbindungsfehler. Bitte versuche es erneut.');
		}
	}

	private async init() {
		const token = localStorage.getItem('token');
		if (!token) {
			await this.router.push('/');
			return;
		}
		await this.loadData();
	}

	private renderContent() {
		if (this.loading) return html`<div class="loading-state">Laden…</div>`;
		return html`
			${this.error ? html`<div class="error-state">${this.error}</div>` : ''}
			<my-food-summary-card
				.period=${this.period}
				.summary=${this.summary}
				.calorieGoal=${this.calorieGoal}
				.proteinGoal=${this.proteinGoal}
				@period-change=${(e: CustomEvent<{ period: Period }>) => this.handlePeriodChange(e.detail.period)}
			></my-food-summary-card>
			<my-food-entry-list
				.period=${this.period}
				.entries=${this.entries}
				.entryFoodsMap=${this.entryFoodsMap}
				@entry-delete=${(e: CustomEvent<{ entryId: string }>) => this.handleEntryDelete(e.detail.entryId)}
			></my-food-entry-list>
		`;
	}

	private renderConfirmDialog() {
		if (!this.confirmDeleteEntryId) return nothing;
		return html`
			<div class="confirm-overlay">
				<div class="confirm-dialog">
					<p class="confirm-title">Eintrag löschen?</p>
					<p class="confirm-message">Dieser Eintrag und alle zugehörigen Lebensmittel werden entfernt.</p>
					<div class="confirm-actions">
						<button
							class="confirm-btn confirm-btn--cancel"
							@click=${() => {
								this.confirmDeleteEntryId = null;
							}}
						>
							Abbrechen
						</button>
						<button class="confirm-btn confirm-btn--delete" @click=${() => void this.confirmDelete()}>
							Löschen
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private async handlePeriodChange(p: Period) {
		if (p === this.period) return;
		this.period = p;
		await this.loadData();
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'app-foodtracking': FoodTrackingComponent;
	}
}
