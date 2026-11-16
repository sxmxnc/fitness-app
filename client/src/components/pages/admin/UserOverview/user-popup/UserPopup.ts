/**
 * Autor: Luca Lammers

 */
import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import componentStyle from '../UserOverview.css?inline';
import type { Session } from './session-chart-data';
import type { FoodStats } from './components/popup-tab-food';
import './components/popup-tab-data';
import './components/popup-tab-overview';
import './components/popup-tab-food';

export type { Session };

/** Describes the user stats shape. */
export interface UserStats {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	createdAt: number;
	isDeactivated: boolean;
	weight: number | null;
	height: number | null;
	birthDate: number | null;
	dailyCalorieGoal: number | null;
	dailyProteinGoal: number | null;
	dailyFatGoal: number | null;
	dailyCarbsGoal: number | null;
}

/** Defines the user popup Lit component. */
@customElement('user-popup')
export class UserPopup extends LitElement {
	static readonly styles = [componentStyle];

	@property({ type: Object }) user: UserStats | null = null;
	@property({ type: Array }) sessions: Session[] = [];
	@property({ type: Object }) foodStats: FoodStats | null = null;
	@property({ type: Boolean }) loading = false;

	@state() private popupTab: 'data' | 'overview' | 'food' = 'data';

	/**
	 * Responds to Lit property updates after rendering.
	 * @param {PropertyValues} changedProps changed props.
	 */
	override updated(changedProps: PropertyValues) {
		if (changedProps.has('user') && this.user !== null) {
			this.popupTab = 'data';
		}
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		const u = this.user;

		return html`
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
			<div
				class="overlay"
				data-testid="user-popup-overlay"
				@click=${
					/**
					 * Handles the inline callback for the surrounding UI operation.
					 * @param {Event} e DOM event emitted by the UI.
					 */
					(e: Event) => e.target === e.currentTarget && this.close()
				}
			>
				<div class="popup" data-testid="user-popup">
					<div class="popup-header">
						<div>
							<div class="popup-name" data-testid="user-popup-name">${u?.firstName} ${u?.lastName}</div>
							<div class="popup-email" data-testid="user-popup-email">${u?.email}</div>
						</div>
						<button
							class="popup-close"
							data-testid="user-popup-close-btn"
							@click=${
								/** Handles the inline callback for the surrounding UI operation. */
								() => this.close()
							}
						>
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

					<div class="popup-tabs">
						<button
							class="popup-tab ${this.popupTab === 'data' ? 'active' : ''}"
							data-testid="user-popup-tab-data"
							@click=${
								/**
								 * Handles the inline callback for the surrounding UI operation.
								 * @returns {string} The formatted string.
								 */
								() => (this.popupTab = 'data')
							}
						>
							Daten
						</button>
						<button
							class="popup-tab ${this.popupTab === 'overview' ? 'active' : ''}"
							data-testid="user-popup-tab-overview"
							@click=${
								/**
								 * Handles the inline callback for the surrounding UI operation.
								 * @returns {string} The formatted string.
								 */
								() => (this.popupTab = 'overview')
							}
						>
							Übersicht
						</button>
						<button
							class="popup-tab ${this.popupTab === 'food' ? 'active' : ''}"
							data-testid="user-popup-tab-food"
							@click=${
								/**
								 * Handles the inline callback for the surrounding UI operation.
								 * @returns {string} The formatted string.
								 */
								() => (this.popupTab = 'food')
							}
						>
							Foodtracking
						</button>
					</div>

					${this.renderTabContent()}
				</div>
			</div>
		`;
	}

	/**
	 * Renders tab content.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	private renderTabContent() {
		if (this.loading) {
			return html`<div class="popup-loading" data-testid="user-popup-loading">Laden...</div>`;
		}
		if (this.popupTab === 'data') {
			return html`<popup-tab-data .user=${this.user}></popup-tab-data>`;
		}
		if (this.popupTab === 'overview') {
			return html`<popup-tab-overview .sessions=${this.sessions}></popup-tab-overview>`;
		}
		return html`<popup-tab-food .foodStats=${this.foodStats} .user=${this.user}></popup-tab-food>`;
	}

	/** Closes close. */
	private close() {
		this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
	}
}
