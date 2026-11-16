/**
 * Autor: Justus Heinz

 */
import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { Router, routerContext } from '../../../../router.js';
import '../common/user-header/user-header';
import '../common/user-nav/user-nav';
import '../../../common/success-message/success-message.js';
import '../../../common/error-message/error-message.js';
import type { SuccessMessage } from '../../../common/success-message/success-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';
import layoutStyle from './workout-layout.css?inline';
import statesStyle from './workout-states.css?inline';
import cardStyle from './plan-card.css?inline';
import { HttpClient, httpClientContext } from '../../../../http-client.js';
import workoutPlanService, { type WorkoutPlan, type DisplayPlan } from './workout-plan.service.js';
import './workout-plan-modal.js';
import type { WorkoutPlanModal } from './workout-plan-modal.js';
import './workout-plan-card.js';

// classicOverrides: maps systemPlanId → user-owned plan ID (edited) | 'deleted'
type ClassicOverrides = Record<string, string>;

@customElement('app-workout-list')
export class WorkoutList extends LitElement {
	static styles = [
		layoutStyle,
		statesStyle,
		cardStyle,
		css`
			:host {
				display: block;
			}
		`
	];

	@consume({ context: routerContext }) private router!: Router;
	@consume({ context: httpClientContext }) private http!: HttpClient;

	@query('success-message') private readonly successMsg!: SuccessMessage;
	@query('error-message') private readonly errorMsg!: ErrorMessage;
	@query('workout-plan-modal') private readonly modal!: WorkoutPlanModal;

	@state() private plans: WorkoutPlan[] = [];
	@state() private loading = true;
	@state() private classicOverrides: ClassicOverrides = {};
	@state() private planOrder: string[] = [];
	@state() private liveOrder: string[] | null = null;
	@state() private draggingId: string | null = null;

	private longpressTimer: ReturnType<typeof setTimeout> | null = null;
	private dragStartY = 0;

	private get userId() {
		return localStorage.getItem('userId') ?? '';
	}

	private get baseDisplayPlans(): DisplayPlan[] {
		const overriddenIds = new Set(Object.keys(this.classicOverrides));
		const modifiedUserPlanIds = new Set(Object.values(this.classicOverrides).filter(v => v !== 'deleted'));
		const overrideEntries = Object.entries(this.classicOverrides);

		return this.plans
			.filter(p => !(p.isSystemProperty && overriddenIds.has(p.id)))
			.map(p => ({
				...p,
				isModifiedClassic: !p.isSystemProperty && modifiedUserPlanIds.has(p.id),
				originalClassicId: !p.isSystemProperty
					? (overrideEntries.find(([, v]) => v === p.id)?.[0] ?? null)
					: null
			}));
	}

	private get displayPlans(): DisplayPlan[] {
		const base = this.baseDisplayPlans;
		const order = this.liveOrder ?? this.planOrder;
		if (order.length === 0) return base;
		const indexMap = new Map(order.map((id, i) => [id, i]));
		return [...base].sort((a, b) => {
			const ai = indexMap.has(a.id) ? indexMap.get(a.id)! : Infinity;
			const bi = indexMap.has(b.id) ? indexMap.get(b.id)! : Infinity;
			return ai - bi;
		});
	}

	private get deletedClassics(): WorkoutPlan[] {
		const deletedIds = new Set(
			Object.entries(this.classicOverrides)
				.filter(([, v]) => v === 'deleted')
				.map(([k]) => k)
		);
		return this.plans.filter(p => p.isSystemProperty && deletedIds.has(p.id));
	}

	override async connectedCallback() {
		super.connectedCallback();
		this.addEventListener('touchmove', this.onTouchMoveBlock as EventListener, { passive: false });
		if (!localStorage.getItem('token') || !localStorage.getItem('userId')) {
			await this.router.push('/');
			return;
		}
		const stored = localStorage.getItem(`classic_overrides_${this.userId}`);
		if (stored) {
			try {
				this.classicOverrides = JSON.parse(stored);
			} catch {
				/* ignore */
			}
		}
		await Promise.all([this.loadPlans(), this.loadPlanOrder()]);
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener('touchmove', this.onTouchMoveBlock as EventListener);
		document.removeEventListener('pointermove', this.onDocMove);
		document.removeEventListener('pointerup', this.onDocUp);
		document.removeEventListener('pointercancel', this.onDocUp);
	}

	// AI-Generated
	render() {
		const displayed = this.displayPlans;
		const deleted = this.deletedClassics;

		return html`
			<app-header></app-header>
			<success-message></success-message>
			<error-message></error-message>
			<workout-plan-modal
				@plan-saved=${this.onPlanSaved}
				@classic-saved=${this.onClassicSaved}
			></workout-plan-modal>
			<div class="page-content">
				<div class="workout-container">
					<div class="list-header">
						<button class="btn-new-plan" data-testid="new-plan-btn" @click=${this.openModal}>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
							New Plan
						</button>
					</div>

					${this.loading
						? html`<div class="loading-state">Pläne werden geladen…</div>`
						: displayed.length === 0 && deleted.length === 0
							? html`
									<div class="empty-state" data-testid="empty-state">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
											<rect x="8" y="10.5" width="8" height="3" rx="0.8" />
											<rect x="5" y="8.5" width="3" height="7" rx="1" />
											<rect x="1.5" y="7" width="3.5" height="10" rx="1.2" />
											<rect x="16" y="8.5" width="3" height="7" rx="1" />
											<rect x="19" y="7" width="3.5" height="10" rx="1.2" />
										</svg>
										<p>Noch keine Workout-Pläne vorhanden.</p>
										<button class="btn-empty-cta" @click=${this.openModal}>
											New Plan erstellen
										</button>
									</div>
								`
							: html`
									<div class="plan-list" data-testid="plan-list">
										${displayed.map(
											plan => html`
												<workout-plan-card
													data-plan-id=${plan.id}
													data-testid="plan-card"
													.plan=${plan}
													.isDragging=${this.draggingId === plan.id}
													@pointerdown=${(e: PointerEvent) =>
														this.onCardPointerDown(e, plan.id)}
													@pointermove=${(e: PointerEvent) => this.onCardPointerMove(e)}
													@pointerup=${() => this.onCardPointerUp()}
													@contextmenu=${(e: Event) => e.preventDefault()}
													@plan-edit=${() => this.openEditModal(plan)}
													@plan-delete=${() =>
														plan.isSystemProperty
															? this.deleteClassic(plan)
															: this.deletePlan(plan.id)}
													@plan-start=${() => this.router.push(`/workouts/${plan.id}/start`)}
													@plan-restore=${() => this.restoreClassic(plan.originalClassicId!)}
												></workout-plan-card>
											`
										)}
									</div>

									${deleted.length > 0
										? html`
												<div class="deleted-classics-section">
													<span class="deleted-classics-label"
														>Ausgeblendete Classic Pläne</span
													>
													${deleted.map(
														plan => html`
															<div class="deleted-classic-row">
																<span class="deleted-classic-name">${plan.name}</span>
																<button
																	class="btn-restore-text"
																	data-testid="restore-classic-btn"
																	@click=${() => this.restoreClassic(plan.id)}
																>
																	Wiederherstellen
																</button>
															</div>
														`
													)}
												</div>
											`
										: ''}
								`}
				</div>
			</div>
			<app-nav></app-nav>
		`;
	}

	private readonly onDocMove = (e: PointerEvent) => this._onDocPointerMove(e);
	private readonly onDocUp = () => this._onDocPointerUp();
	private readonly onTouchMoveBlock = (e: TouchEvent) => {
		if (this.draggingId) e.preventDefault();
	};

	private saveOverrides() {
		localStorage.setItem(`classic_overrides_${this.userId}`, JSON.stringify(this.classicOverrides));
	}

	private async loadPlans() {
		this.loading = true;
		try {
			this.plans = await workoutPlanService.getPlans(this.http, this.userId);
		} finally {
			this.loading = false;
		}
	}

	private async loadPlanOrder() {
		this.planOrder = await workoutPlanService.getPlanOrder(this.http, this.userId);
	}

	private async savePlanOrder() {
		await workoutPlanService.savePlanOrder(this.http, this.userId, this.planOrder);
	}

	private openModal() {
		this.modal.open();
	}

	private openEditModal(plan: WorkoutPlan) {
		if (plan.isSystemProperty) {
			void this.modal.openForClassic(plan);
		} else {
			void this.modal.openForEdit(plan);
		}
	}

	private onPlanSaved(e: CustomEvent<{ message: string }>) {
		this.successMsg.show(e.detail.message);
		void this.loadPlans();
	}

	private onClassicSaved(e: CustomEvent<{ classicId: string; newPlanId: string; message: string }>) {
		this.classicOverrides = { ...this.classicOverrides, [e.detail.classicId]: e.detail.newPlanId };
		this.saveOverrides();
		this.successMsg.show(e.detail.message);
		void this.loadPlans();
	}

	private async deletePlan(planId: string) {
		try {
			const ok = await workoutPlanService.deletePlan(this.http, this.userId, planId);
			if (ok) {
				this.successMsg.show('Plan gelöscht.');
				await this.loadPlans();
			} else {
				this.errorMsg.show('Plan konnte nicht gelöscht werden.');
			}
		} catch {
			this.errorMsg.show('Server nicht erreichbar.');
		}
	}

	private deleteClassic(plan: WorkoutPlan) {
		this.classicOverrides = { ...this.classicOverrides, [plan.id]: 'deleted' };
		this.saveOverrides();
		this.successMsg.show('Classic Plan ausgeblendet.');
	}

	private async restoreClassic(systemPlanId: string) {
		const override = this.classicOverrides[systemPlanId];
		if (override && override !== 'deleted') {
			try {
				await workoutPlanService.deletePlan(this.http, this.userId, override);
			} catch {
				/* ignore — plan may already be gone */
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { [systemPlanId]: removed, ...rest } = this.classicOverrides;
		this.classicOverrides = rest;
		this.saveOverrides();
		this.successMsg.show('Classic Plan wiederhergestellt!');
		await this.loadPlans();
	}

	// DRAG AND DROP

	private _buildEffectiveOrder(): string[] {
		const displayedIds = this.baseDisplayPlans.map(p => p.id);
		const validSaved = this.planOrder.filter(id => displayedIds.includes(id));
		const newIds = displayedIds.filter(id => !validSaved.includes(id));
		return [...validSaved, ...newIds];
	}

	private onCardPointerDown(e: PointerEvent, planId: string) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		this.dragStartY = e.clientY;
		this.longpressTimer = setTimeout(() => {
			this.longpressTimer = null;
			this.draggingId = planId;
			this.liveOrder = this._buildEffectiveOrder();
			document.addEventListener('pointermove', this.onDocMove);
			document.addEventListener('pointerup', this.onDocUp);
			document.addEventListener('pointercancel', this.onDocUp);
		}, 500);
	}

	private onCardPointerMove(e: PointerEvent) {
		if (this.longpressTimer && Math.abs(e.clientY - this.dragStartY) > 8) {
			clearTimeout(this.longpressTimer);
			this.longpressTimer = null;
		}
	}

	private onCardPointerUp() {
		if (this.longpressTimer) {
			clearTimeout(this.longpressTimer);
			this.longpressTimer = null;
		}
	}

	private _onDocPointerMove(e: PointerEvent) {
		if (!this.draggingId || !this.liveOrder) return;
		const list = this.shadowRoot?.querySelector('.plan-list');
		if (!list) return;
		const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-plan-id]'));
		const clientY = e.clientY;
		let targetIndex = this.liveOrder.length - 1;
		for (let i = 0; i < cards.length; i++) {
			const rect = cards[i].getBoundingClientRect();
			if (clientY < rect.top + rect.height / 2) {
				targetIndex = i;
				break;
			}
		}
		const fromIdx = this.liveOrder.indexOf(this.draggingId);
		if (fromIdx !== -1 && fromIdx !== targetIndex) {
			const newOrder = [...this.liveOrder];
			newOrder.splice(fromIdx, 1);
			newOrder.splice(targetIndex, 0, this.draggingId);
			this.liveOrder = newOrder;
		}
	}

	private _onDocPointerUp() {
		document.removeEventListener('pointermove', this.onDocMove);
		document.removeEventListener('pointerup', this.onDocUp);
		document.removeEventListener('pointercancel', this.onDocUp);
		if (this.draggingId && this.liveOrder) {
			this.planOrder = [...this.liveOrder];
			void this.savePlanOrder();
			this.successMsg.show('Reihenfolge gespeichert!');
		}
		this.draggingId = null;
		this.liveOrder = null;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'app-workout-list': WorkoutList;
	}
}
