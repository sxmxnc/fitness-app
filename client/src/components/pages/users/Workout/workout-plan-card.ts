/**
 * Autor: Justus Heinz

 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DisplayPlan } from './workout-plan.service.js';
import cardStyle from './plan-card.css?inline';

@customElement('workout-plan-card')
export class WorkoutPlanCard extends LitElement {
	static styles = [
		cardStyle,
		css`
			:host {
				display: block;
			}
		`
	];

	@property({ type: Object }) plan!: DisplayPlan;
	@property({ type: Boolean }) isDragging = false;

	render() {
		const { plan } = this;
		if (!plan) return html``;
		return html`
			<div class="plan-card ${this.isDragging ? 'is-dragging' : ''}">
				<div class="plan-card-body">
					<div class="drag-handle" aria-hidden="true">
						<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
							<circle cx="7" cy="4" r="1.5" />
							<circle cx="7" cy="10" r="1.5" />
							<circle cx="7" cy="16" r="1.5" />
							<circle cx="13" cy="4" r="1.5" />
							<circle cx="13" cy="10" r="1.5" />
							<circle cx="13" cy="16" r="1.5" />
						</svg>
					</div>
					<div class="plan-info">
						<span class="plan-name">${plan.name}</span>
						${plan.description ? html`<span class="plan-desc">${plan.description}</span>` : ''}
						<span class="plan-exercises"
							>${plan.exerciseCount} Übung${plan.exerciseCount !== 1 ? 'en' : ''}</span
						>
					</div>
					<div class="plan-actions">
						<div class="btn-start-col">
							${plan.isSystemProperty
								? html`<span class="plan-badge">Classic</span>`
								: plan.isModifiedClassic
									? html`<span class="plan-badge plan-badge-modified">Classic</span>`
									: ''}
							<button class="btn-start" data-testid="start-btn" @click=${() => this.emit('plan-start')}>
								Start
							</button>
						</div>
						<button
							class="btn-edit"
							data-testid="edit-plan-btn"
							title="Plan bearbeiten"
							@click=${() => this.emit('plan-edit')}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
							</svg>
						</button>
						${plan.isModifiedClassic
							? html`
									<button
										class="btn-restore"
										data-testid="restore-plan-btn"
										title="Auf Classic zurücksetzen"
										@click=${() => this.emit('plan-restore')}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
											<path d="M3 3v5h5" />
										</svg>
									</button>
								`
							: ''}
						<button
							class="btn-delete"
							data-testid="delete-plan-btn"
							title=${plan.isSystemProperty ? 'Classic ausblenden' : 'Plan löschen'}
							@click=${() => this.emit('plan-delete')}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="3 6 5 6 21 6" />
								<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
								<path d="M10 11v6" />
								<path d="M14 11v6" />
								<path d="M9 6V4h6v2" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private emit(name: string) {
		this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'workout-plan-card': WorkoutPlanCard;
	}
}
