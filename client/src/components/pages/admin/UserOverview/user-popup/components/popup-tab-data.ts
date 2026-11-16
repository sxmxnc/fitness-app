/**
 * Autor: Luca Lammers

 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from '../../UserOverview.css?inline';

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

/** Defines popup tab data. */
@customElement('popup-tab-data')
export class PopupTabData extends LitElement {
	static readonly styles = [
		componentStyle,
		css`
			:host {
				flex: 1;
				height: auto;
				background: none;
				min-height: 0;
				overflow: hidden;
			}
			.popup-grid {
				flex: 1;
				align-content: start;
			}
		`
	];

	@property({ type: Object }) user: UserStats | null = null;

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		const u = this.user;
		const formatDate =
			/**
			 * Formats date.
			 * @param {number | null} ts ts.
			 * @returns {string} The formatted string.
			 */
			(ts: number | null) => (ts ? new Date(Number(ts)).toLocaleDateString('de-DE') : '—');
		const fmt =
			/**
			 * Formats fmt.
			 * @param {number | null} v v.
			 * @param {string} unit unit.
			 * @returns {string} The formatted string.
			 */
			(v: number | null, unit = '') => (v == null ? '—' : `${v}${unit}`);

		return html`
			<div class="popup-grid" data-testid="user-popup-data-grid">
				<div class="stat-card" data-testid="user-popup-stat-registered">
					<span class="stat-label">Registriert am</span>
					<span class="stat-value">${formatDate(u?.createdAt ?? null)}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-status">
					<span class="stat-label">Status</span>
					<span class="status-badge ${u?.isDeactivated ? 'inactive' : 'active'}">
						${u?.isDeactivated ? 'Inaktiv' : 'Aktiv'}
					</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-weight">
					<span class="stat-label">Gewicht</span>
					<span class="stat-value">${fmt(u?.weight ?? null, ' kg')}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-height">
					<span class="stat-label">Größe</span>
					<span class="stat-value">${fmt(u?.height ?? null, ' cm')}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-birthdate">
					<span class="stat-label">Geburtsdatum</span>
					<span class="stat-value">${formatDate(u?.birthDate ?? null)}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-calorie">
					<span class="stat-label">Kalorienziel</span>
					<span class="stat-value">${fmt(u?.dailyCalorieGoal ?? null, ' kcal')}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-protein">
					<span class="stat-label">Proteinziel</span>
					<span class="stat-value">${fmt(u?.dailyProteinGoal ?? null, ' g')}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-fat">
					<span class="stat-label">Fettziel</span>
					<span class="stat-value">${fmt(u?.dailyFatGoal ?? null, ' g')}</span>
				</div>
				<div class="stat-card" data-testid="user-popup-stat-carbs">
					<span class="stat-label">Kohlenhydratziel</span>
					<span class="stat-value">${fmt(u?.dailyCarbsGoal ?? null, ' g')}</span>
				</div>
			</div>
		`;
	}
}
