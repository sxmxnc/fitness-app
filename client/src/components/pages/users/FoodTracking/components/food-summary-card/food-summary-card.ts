/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './food-summary-card.css?inline';
import { type Period, type SummaryData, PERIODS, PERIOD_LABELS, SUMMARY_TITLES } from '../../food-tracking.types.js';

@customElement('my-food-summary-card')
export class FoodSummaryCardComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: String }) period: Period = 'daily';
	@property({ type: Object }) summary: SummaryData | null = null;
	@property({ type: Number }) calorieGoal: number | null = null;
	@property({ type: Number }) proteinGoal: number | null = null;

	render() {
		return html`
			${this.renderPeriodTabs()} ${this.renderSummaryCard()}
			${this.period !== 'daily' ? this.renderBreakdown() : ''}
		`;
	}

	private handleTabClick(p: Period) {
		this.dispatchEvent(
			new CustomEvent<{ period: Period }>('period-change', {
				detail: { period: p },
				bubbles: true,
				composed: true
			})
		);
	}

	private formatDateShort(ms: number): string {
		return new Date(ms).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
	}

	private renderPeriodTabs() {
		return html`
			<div class="period-tabs" data-testid="food-summary-period-tabs">
				${PERIODS.map(
					p => html`
						<button
							class="period-tab ${this.period === p ? 'active' : ''}"
							data-testid="food-summary-tab-${p}"
							@click=${() => this.handleTabClick(p)}
							type="button"
						>
							${PERIOD_LABELS[p]}
						</button>
					`
				)}
			</div>
		`;
	}

	private renderSummaryCard() {
		const summary = this.summary;
		const showProtein = this.period === 'daily' && !!this.proteinGoal;
		return html`
			<div class="food-card summary-card">
				<div class="summary-title">${SUMMARY_TITLES[this.period]}</div>
				<div class="summary-top-row">
					<div class="summary-main">
						<div class="summary-calories" data-testid="food-summary-calories">
							${summary?.totalCalories ?? 0}
							<span class="summary-unit">kcal</span>
						</div>
						${this.renderCalorieGoalBar()}
					</div>
					${showProtein
						? html`
								<div class="summary-divider"></div>
								<div class="summary-protein-goal">${this.renderProteinGoalBlock()}</div>
							`
						: ''}
				</div>
				<div class="summary-macros" data-testid="food-summary-macros">
					<div class="macro-item">
						<span class="macro-value">${summary?.totalProtein ?? 0}g</span>
						<span class="macro-label">Eiweiß</span>
					</div>
					<div class="macro-item">
						<span class="macro-value">${summary?.totalFat ?? 0}g</span>
						<span class="macro-label">Fett</span>
					</div>
					<div class="macro-item">
						<span class="macro-value">${summary?.totalCarbs ?? 0}g</span>
						<span class="macro-label">Kohlenhydrate</span>
					</div>
				</div>
			</div>
		`;
	}

	private renderCalorieGoalBar() {
		if (this.period !== 'daily' || !this.calorieGoal) return nothing;
		const consumed = this.summary?.totalCalories ?? 0;
		const goal = this.calorieGoal;
		const pct = Math.max(0, (consumed / goal) * 100);
		const fillWidth = Math.min(pct, 100);
		// orange at 90% warns before the limit is hit; red above 100%
		let colorClass: string;
		if (pct > 100) colorClass = 'bar-red';
		else if (pct >= 90) colorClass = 'bar-orange';
		else colorClass = 'bar-green';
		const pctLabel = pct > 100 ? '>100%' : `${Math.round(pct)}%`;
		return html`
			<div class="calorie-goal-bar" data-testid="food-summary-goal-bar">
				<div class="goal-bar-track">
					<div class="goal-bar-fill ${colorClass}" style="width: ${fillWidth}%;"></div>
				</div>
				<div class="goal-bar-info">
					<span class="goal-bar-text">${consumed} / ${goal} kcal</span>
					<span class="goal-bar-pct ${colorClass}">${pctLabel}</span>
				</div>
			</div>
		`;
	}

	private renderProteinGoalBlock() {
		if (!this.proteinGoal) return nothing;
		const consumed = this.summary?.totalProtein ?? 0;
		const goal = this.proteinGoal;
		const pct = Math.max(0, (consumed / goal) * 100);
		const fillWidth = Math.min(pct, 100);
		// protein uses a "more is better" gradient — green only when fully met
		let colorClass: string;
		if (pct >= 100) colorClass = 'bar-green';
		else if (pct >= 80) colorClass = 'bar-green-light';
		else if (pct >= 50) colorClass = 'bar-orange';
		else colorClass = 'bar-red';
		const pctLabel = pct > 100 ? '>100%' : `${Math.round(pct)}%`;
		return html`
			<div class="protein-goal-label" data-testid="food-summary-protein-consumed">
				<span>${consumed}g / ${goal}g</span><span class="protein-goal-word"> Protein</span>
			</div>
			<div class="goal-bar-track">
				<div class="goal-bar-fill ${colorClass}" style="width: ${fillWidth}%;"></div>
			</div>
			<div class="goal-bar-info">
				<span class="goal-bar-pct ${colorClass}">${pctLabel}</span>
			</div>
		`;
	}

	private renderBreakdown() {
		const breakdown = this.summary?.breakdown ?? [];
		if (breakdown.length === 0) {
			return html`
				<div class="empty-state" data-testid="food-summary-empty">
					<div class="empty-icon">📊</div>
					<div class="empty-title">Keine Daten für diesen Zeitraum</div>
					<div class="empty-subtitle">Beginne mit der Erfassung, um deine Statistiken zu sehen</div>
				</div>
			`;
		}
		return html`
			<div class="breakdown-list" data-testid="food-summary-breakdown">
				${breakdown.map(
					row => html`
						<div class="food-card breakdown-row">
							<span class="breakdown-date">${this.formatDateShort(row.date)}</span>
							<span class="breakdown-calories">${row.calories} kcal</span>
							<span class="breakdown-macros">
								Eiweiß: ${row.protein}g | Fett: ${row.fat}g | Kohlenhydrate: ${row.carbs}g
							</span>
						</div>
					`
				)}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-food-summary-card': FoodSummaryCardComponent;
	}
}
