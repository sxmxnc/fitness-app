/**
 * Autor: Luca Lammers

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
import { requireAdminAuth } from '../common/admin-auth.js';
import { BASE_API } from '../../../../config.js';
import componentStyle from './WorkoutOverview.css?inline';
import { HttpClient, httpClientContext } from '../../../../http-client.js';

interface SystemExercise {
	id: string;
	name: string;
	type: 'weighted' | 'bodyweight' | 'cardio';
	description: string | null;
	muscleGroup: string | null;
}

interface SystemPlanExercise {
	id: string;
	exerciseId: string;
	exerciseOrder: number;
	targetSets: number | null;
	targetReps: number | null;
	targetWeight: number | null;
	targetDurationMinutes: number | null;
}

interface SystemPlan {
	id: string;
	name: string;
	description: string | null;
	exercises: SystemPlanExercise[];
}

interface NewPlanExercise {
	exerciseId: string;
	sets: number;
	reps: number;
	weight: number;
	activeDropdown: boolean;
	searchText: string;
}

type SortKey = 'name-asc' | 'name-desc' | 'type';

const SORT_LABELS: Record<SortKey, string> = {
	'name-asc': 'A–Z',
	'name-desc': 'Z–A',
	'type': 'Typ'
};

const TYPE_LABELS: Record<string, string> = {
	weighted: 'Gewichte',
	bodyweight: 'Körpergewicht',
	cardio: 'Cardio'
};

@customElement('admin-workouts')
export class AdminWorkouts extends LitElement {
	static styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@query('success-message') private readonly successMsg!: SuccessMessage;
	@query('error-message') private readonly errorMsg!: ErrorMessage;

	// shared
	@state() private activeTab: 'exercises' | 'plans' = 'exercises';

	// exercises tab
	@state() private exercises: SystemExercise[] = [];
	@state() private loading = true;
	@state() private error = '';
	@state() private search = '';
	@state() private sort: SortKey = 'name-asc';
	@state() private confirmDeleteExercise: SystemExercise | null = null;
	@state() private showCreate = false;
	@state() private createName = '';
	@state() private createType: 'weighted' | 'bodyweight' | 'cardio' = 'weighted';
	@state() private createMuscleGroup = '';
	@state() private createDescription = '';
	@state() private createError = '';

	// plans tab
	@state() private plans: SystemPlan[] = [];
	@state() private plansLoading = true;
	@state() private plansError = '';
	@state() private confirmDeletePlan: SystemPlan | null = null;
	@state() private editingPlan: SystemPlan | null = null;
	@state() private showCreatePlan = false;
	@state() private createPlanName = '';
	@state() private createPlanDescription = '';
	@state() private createPlanExercises: NewPlanExercise[] = [];
	@state() private createPlanError = '';
	// add-exercise row in edit overlay
	@state() private addExId = '';
	@state() private addExSearch = '';
	@state() private addExDropdown = false;
	@state() private addExSets = 3;
	@state() private addExReps = 10;
	@state() private addExWeight = 0;
	@state() private addExError = '';

	private get filteredExercises(): SystemExercise[] {
		const q = this.search.toLowerCase();
		let list = this.exercises.filter(e => e.name.toLowerCase().includes(q));
		if (this.sort === 'name-asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
		else if (this.sort === 'name-desc') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
		else list = [...list].sort((a, b) => a.type.localeCompare(b.type));
		return list;
	}

	override async connectedCallback() {
		super.connectedCallback();
		this.textContent = 'System';
		if (!(await requireAdminAuth(this.http))) return;
		await Promise.all([this.loadExercises(), this.loadPlans()]);
	}

	render() {
		return html`
			<admin-header></admin-header>
			<success-message></success-message>
			<error-message></error-message>

			<div class="page-header">
				<div class="tab-pills">
					<button
						class="tab-pill ${this.activeTab === 'exercises' ? 'active' : ''}"
						@click=${() => (this.activeTab = 'exercises')}
					>
						Übungen
					</button>
					<button
						class="tab-pill ${this.activeTab === 'plans' ? 'active' : ''}"
						@click=${() => (this.activeTab = 'plans')}
					>
						Workout Pläne
					</button>
				</div>

				${this.activeTab === 'exercises'
					? html`
							<div class="controls">
								<div class="search-wrap">
									<svg class="search-icon" viewBox="0 0 20 20" fill="none">
										<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6" />
										<path
											d="M13 13l3.5 3.5"
											stroke="currentColor"
											stroke-width="1.6"
											stroke-linecap="round"
										/>
									</svg>
									<input
										class="search-input"
										type="text"
										placeholder="Übungen suchen..."
										.value=${this.search}
										@input=${(e: Event) => (this.search = (e.target as HTMLInputElement).value)}
									/>
								</div>
								<button class="btn-new-exercise" @click=${() => this.openCreate()}>+ Neue Übung</button>
								<div class="sort-pills">
									${(['name-asc', 'name-desc', 'type'] as SortKey[]).map(
										key => html`
											<button
												class="sort-pill ${this.sort === key ? 'active' : ''}"
												@click=${() => (this.sort = key)}
											>
												${SORT_LABELS[key]}
											</button>
										`
									)}
								</div>
							</div>
						`
					: html`
							<div class="controls">
								<button class="btn-new-exercise" @click=${() => this.openCreatePlan()}>
									+ Neuer Plan
								</button>
							</div>
						`}
			</div>

			<div class="page-content">
				${this.activeTab === 'exercises' ? this.renderExercisesTab() : this.renderPlansTab()}
			</div>

			${this.renderConfirmExerciseDialog()} ${this.renderCreateExerciseOverlay()}
			${this.renderConfirmPlanDialog()} ${this.renderCreatePlanOverlay()} ${this.renderEditPlanOverlay()}
			<admin-nav></admin-nav>
		`;
	}

	// ── Exercises tab ────────────────────────────────

	private exName(id: string) {
		return this.exercises.find(e => e.id === id)?.name ?? id;
	}

	private renderExercisesTab() {
		return html`
			<div class="info-banner" role="note">
				<svg class="info-banner-icon" viewBox="0 0 20 20" fill="none">
					<circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5" />
					<path d="M10 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					<circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
				</svg>
				<span class="info-banner-text"
					>Systemübungen sind global verfügbar und für alle Nutzer sichtbar. Löschungen wirken sich auf alle
					Nutzer der App aus.</span
				>
			</div>
			${this.loading
				? html`<div class="loading">Laden...</div>`
				: this.error
					? html`<div class="error-msg">${this.error}</div>`
					: html`
							<div class="exercise-list">
								${this.filteredExercises.length === 0
									? html`<div class="empty">Keine Systemübungen gefunden</div>`
									: this.filteredExercises.map(
											exercise => html`
												<div class="exercise-row">
													<span class="exercise-name">${exercise.name}</span>
													<span class="exercise-type type-${exercise.type}">
														${TYPE_LABELS[exercise.type] ?? exercise.type}
													</span>
													<span class="exercise-muscle">
														${exercise.muscleGroup ?? '—'}
													</span>
													<div class="exercise-actions">
														<button
															class="btn btn-delete"
															@click=${() => (this.confirmDeleteExercise = exercise)}
														>
															Löschen
														</button>
													</div>
												</div>
											`
										)}
							</div>
						`}
		`;
	}

	private async loadExercises() {
		try {
			const res = await this.http.get(`${BASE_API}/admin/exercises`);
			if (!res.ok) throw new Error();
			this.exercises = await res.json();
		} catch {
			this.error = 'Systemübungen konnten nicht geladen werden.';
		} finally {
			this.loading = false;
		}
	}

	private openCreate() {
		this.createName = '';
		this.createType = 'weighted';
		this.createMuscleGroup = '';
		this.createDescription = '';
		this.createError = '';
		this.showCreate = true;
	}

	private async submitCreate() {
		if (!this.createName.trim()) {
			this.createError = 'Name ist erforderlich.';
			return;
		}
		try {
			const res = await this.http.post(`${BASE_API}/admin/exercises`, {
				name: this.createName.trim(),
				type: this.createType,
				muscleGroup: this.createMuscleGroup.trim() || undefined,
				description: this.createDescription.trim() || undefined
			});
			if (!res.ok) throw new Error();
			const created: SystemExercise = await res.json();
			this.exercises = [created, ...this.exercises];
			this.showCreate = false;
			this.successMsg.show(`"${created.name}" wurde erfolgreich erstellt.`);
		} catch {
			this.createError = 'Übung konnte nicht erstellt werden.';
		}
	}

	private async confirmDeleteEx() {
		const exercise = this.confirmDeleteExercise;
		this.confirmDeleteExercise = null;
		if (!exercise) return;
		try {
			const res = await this.http.delete(`${BASE_API}/admin/exercises/${exercise.id}`);
			if (res.ok) {
				this.exercises = this.exercises.filter(e => e.id !== exercise.id);
				this.successMsg.show(`"${exercise.name}" wurde erfolgreich gelöscht.`);
			} else {
				this.errorMsg.show('Systemübung konnte nicht gelöscht werden.');
			}
		} catch {
			this.errorMsg.show('Verbindungsfehler. Bitte versuche es erneut.');
		}
	}

	private renderConfirmExerciseDialog() {
		if (!this.confirmDeleteExercise) return nothing;
		const name = this.confirmDeleteExercise.name;
		return html`
			<div class="confirm-overlay">
				<div class="confirm-dialog">
					<p class="confirm-title">"${name}" löschen?</p>
					<p class="confirm-message">Diese Systemübung wird für alle Benutzer dauerhaft entfernt.</p>
					<div class="confirm-actions">
						<button
							class="confirm-btn confirm-btn--cancel"
							@click=${() => (this.confirmDeleteExercise = null)}
						>
							Abbrechen
						</button>
						<button class="confirm-btn confirm-btn--delete" @click=${() => void this.confirmDeleteEx()}>
							Löschen
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private renderCreateExerciseOverlay() {
		if (!this.showCreate) return nothing;
		return html`
			<div class="confirm-overlay">
				<div class="create-dialog">
					<p class="confirm-title">Neue Systemübung</p>
					<div class="create-fields">
						<label class="create-label">
							Name *
							<input
								class="create-input"
								type="text"
								placeholder="z.B. Kniebeugen"
								.value=${this.createName}
								@input=${(e: Event) => (this.createName = (e.target as HTMLInputElement).value)}
							/>
						</label>
						<label class="create-label">
							Typ *
							<select
								class="create-input"
								.value=${this.createType}
								@change=${(e: Event) =>
									(this.createType = (e.target as HTMLSelectElement).value as
										| 'weighted'
										| 'bodyweight'
										| 'cardio')}
							>
								<option value="weighted">Gewichte</option>
								<option value="bodyweight">Körpergewicht</option>
								<option value="cardio">Cardio</option>
							</select>
						</label>
						<label class="create-label">
							Muskelgruppe
							<input
								class="create-input"
								type="text"
								placeholder="z.B. Beine"
								.value=${this.createMuscleGroup}
								@input=${(e: Event) => (this.createMuscleGroup = (e.target as HTMLInputElement).value)}
							/>
						</label>
						<label class="create-label">
							Beschreibung
							<textarea
								class="create-input create-textarea"
								placeholder="Optionale Beschreibung"
								.value=${this.createDescription}
								@input=${(e: Event) =>
									(this.createDescription = (e.target as HTMLTextAreaElement).value)}
							></textarea>
						</label>
						${this.createError ? html`<p class="create-error">${this.createError}</p>` : nothing}
					</div>
					<div class="confirm-actions">
						<button class="confirm-btn confirm-btn--cancel" @click=${() => (this.showCreate = false)}>
							Abbrechen
						</button>
						<button class="confirm-btn confirm-btn--create" @click=${() => void this.submitCreate()}>
							Erstellen
						</button>
					</div>
				</div>
			</div>
		`;
	}

	// ── Plans tab ────────────────────────────────────

	private renderPlansTab() {
		return html`
			<div class="info-banner" role="note">
				<svg class="info-banner-icon" viewBox="0 0 20 20" fill="none">
					<circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5" />
					<path d="M10 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					<circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
				</svg>
				<span class="info-banner-text"
					>Classic Pläne sind für alle Nutzer sichtbar und werden mit dem Classic-Badge angezeigt.</span
				>
			</div>
			${this.plansLoading
				? html`<div class="loading">Laden...</div>`
				: this.plansError
					? html`<div class="error-msg">${this.plansError}</div>`
					: html`
							<div class="plan-list">
								${this.plans.length === 0
									? html`<div class="empty">Keine Classic Pläne vorhanden</div>`
									: this.plans.map(
											plan => html`
												<div class="plan-row">
													<div class="plan-info">
														<span class="plan-name">${plan.name}</span>
														${plan.description
															? html`<span class="plan-desc">${plan.description}</span>`
															: nothing}
													</div>
													<span class="exercise-count-badge">
														${plan.exercises.length}
														Übung${plan.exercises.length !== 1 ? 'en' : ''}
													</span>
													<div class="plan-actions">
														<button
															class="btn btn-edit-plan"
															@click=${() => this.openEditPlan(plan)}
														>
															Übungen
														</button>
														<button
															class="btn btn-delete"
															@click=${() => (this.confirmDeletePlan = plan)}
														>
															Löschen
														</button>
													</div>
												</div>
											`
										)}
							</div>
						`}
		`;
	}

	private async loadPlans() {
		try {
			const res = await this.http.get(`${BASE_API}/admin/workout-plans`);
			if (!res.ok) throw new Error();
			this.plans = await res.json();
		} catch {
			this.plansError = 'Classic Pläne konnten nicht geladen werden.';
		} finally {
			this.plansLoading = false;
		}
	}

	private openCreatePlan() {
		this.createPlanName = '';
		this.createPlanDescription = '';
		this.createPlanExercises = [];
		this.createPlanError = '';
		this.showCreatePlan = true;
	}

	private addCreatePlanExercise() {
		this.createPlanExercises = [
			...this.createPlanExercises,
			{ exerciseId: '', sets: 3, reps: 10, weight: 0, activeDropdown: false, searchText: '' }
		];
	}

	private removeCreatePlanExercise(i: number) {
		this.createPlanExercises = this.createPlanExercises.filter((_, idx) => idx !== i);
	}

	private updateCreatePlanExercise(i: number, field: keyof NewPlanExercise, value: string | number | boolean) {
		this.createPlanExercises = this.createPlanExercises.map((ex, idx) =>
			idx === i ? { ...ex, [field]: value } : ex
		);
	}

	private selectCreatePlanExercise(i: number, exercise: SystemExercise) {
		this.createPlanExercises = this.createPlanExercises.map((ex, idx) =>
			idx === i ? { ...ex, exerciseId: exercise.id, searchText: exercise.name, activeDropdown: false } : ex
		);
	}

	private async submitCreatePlan() {
		if (!this.createPlanName.trim()) {
			this.createPlanError = 'Name ist erforderlich.';
			return;
		}
		if (this.createPlanExercises.some(ex => !ex.exerciseId)) {
			this.createPlanError = 'Bitte alle Übungen aus der Liste auswählen.';
			return;
		}
		try {
			const planRes = await this.http.post(`${BASE_API}/admin/workout-plans`, {
				name: this.createPlanName.trim(),
				description: this.createPlanDescription.trim() || undefined
			});
			if (!planRes.ok) throw new Error();
			const plan: SystemPlan = await planRes.json();

			for (let i = 0; i < this.createPlanExercises.length; i++) {
				const ex = this.createPlanExercises[i];
				await this.http.post(`${BASE_API}/admin/workout-plans/${plan.id}/exercises`, {
					exerciseId: ex.exerciseId,
					exerciseOrder: i + 1,
					targetSets: ex.sets || null,
					targetReps: ex.reps || null,
					targetWeight: ex.weight || null
				});
			}

			await this.loadPlans();
			this.showCreatePlan = false;
			this.successMsg.show(`"${plan.name}" wurde erfolgreich erstellt.`);
		} catch {
			this.createPlanError = 'Plan konnte nicht erstellt werden.';
		}
	}

	private async confirmDeletePlanFn() {
		const plan = this.confirmDeletePlan;
		this.confirmDeletePlan = null;
		if (!plan) return;
		try {
			const res = await this.http.delete(`${BASE_API}/admin/workout-plans/${plan.id}`);
			if (res.ok) {
				this.plans = this.plans.filter(p => p.id !== plan.id);
				this.successMsg.show(`"${plan.name}" wurde erfolgreich gelöscht.`);
			} else {
				this.errorMsg.show('Plan konnte nicht gelöscht werden.');
			}
		} catch {
			this.errorMsg.show('Verbindungsfehler. Bitte versuche es erneut.');
		}
	}

	private openEditPlan(plan: SystemPlan) {
		this.editingPlan = { ...plan, exercises: [...plan.exercises] };
		this.addExId = '';
		this.addExSearch = '';
		this.addExDropdown = false;
		this.addExSets = 3;
		this.addExReps = 10;
		this.addExWeight = 0;
		this.addExError = '';
	}

	private async removeExerciseFromPlan(planId: string, peId: string) {
		try {
			const res = await this.http.delete(`${BASE_API}/admin/workout-plans/${planId}/exercises/${peId}`);
			if (res.ok) {
				this.editingPlan = {
					...this.editingPlan!,
					exercises: this.editingPlan!.exercises.filter(e => e.id !== peId)
				};
				this.plans = this.plans.map(p =>
					p.id === planId ? { ...p, exercises: p.exercises.filter(e => e.id !== peId) } : p
				);
			} else {
				this.errorMsg.show('Übung konnte nicht aus dem Plan entfernt werden.');
			}
		} catch {
			this.errorMsg.show('Verbindungsfehler. Bitte versuche es erneut.');
		}
	}

	private async addExerciseToPlan() {
		if (!this.addExId) {
			this.addExError = 'Bitte eine Übung auswählen.';
			return;
		}
		const plan = this.editingPlan!;
		const order = plan.exercises.length + 1;
		try {
			const res = await this.http.post(`${BASE_API}/admin/workout-plans/${plan.id}/exercises`, {
				exerciseId: this.addExId,
				exerciseOrder: order,
				targetSets: this.addExSets || null,
				targetReps: this.addExReps || null,
				targetWeight: this.addExWeight || null
			});
			if (!res.ok) throw new Error();
			const newPlanEx: SystemPlanExercise = await res.json();
			this.editingPlan = {
				...plan,
				exercises: [...plan.exercises, newPlanEx]
			};
			this.plans = this.plans.map(p => (p.id === plan.id ? { ...p, exercises: [...p.exercises, newPlanEx] } : p));
			this.addExId = '';
			this.addExSearch = '';
			this.addExSets = 3;
			this.addExReps = 10;
			this.addExWeight = 0;
			this.addExError = '';
		} catch {
			this.addExError = 'Übung konnte nicht hinzugefügt werden.';
		}
	}

	private renderConfirmPlanDialog() {
		if (!this.confirmDeletePlan) return nothing;
		const name = this.confirmDeletePlan.name;
		return html`
			<div class="confirm-overlay">
				<div class="confirm-dialog">
					<p class="confirm-title">"${name}" löschen?</p>
					<p class="confirm-message">Dieser Classic Plan wird für alle Benutzer dauerhaft entfernt.</p>
					<div class="confirm-actions">
						<button class="confirm-btn confirm-btn--cancel" @click=${() => (this.confirmDeletePlan = null)}>
							Abbrechen
						</button>
						<button class="confirm-btn confirm-btn--delete" @click=${() => void this.confirmDeletePlanFn()}>
							Löschen
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private renderCreatePlanOverlay() {
		if (!this.showCreatePlan) return nothing;
		return html`
			<div class="confirm-overlay">
				<div class="create-dialog">
					<p class="confirm-title">Neuer Classic Plan</p>
					<div class="create-fields">
						<label class="create-label">
							Name *
							<input
								class="create-input"
								type="text"
								placeholder="z.B. Push Day"
								.value=${this.createPlanName}
								@input=${(e: Event) => (this.createPlanName = (e.target as HTMLInputElement).value)}
							/>
						</label>
						<label class="create-label">
							Beschreibung
							<input
								class="create-input"
								type="text"
								placeholder="z.B. Brust, Schultern & Trizeps"
								.value=${this.createPlanDescription}
								@input=${(e: Event) =>
									(this.createPlanDescription = (e.target as HTMLInputElement).value)}
							/>
						</label>

						<div class="plan-exercises-header">
							<span class="create-label" style="margin:0">Übungen</span>
							<button class="btn-add-plan-ex" @click=${() => this.addCreatePlanExercise()}>
								+ Hinzufügen
							</button>
						</div>

						${this.createPlanExercises.map((ex, i) => {
							const q = ex.searchText.toLowerCase();
							const suggestions = this.exercises
								.filter(a => q.length === 0 || a.name.toLowerCase().includes(q))
								.slice(0, 15);
							return html`
								<div class="plan-ex-row">
									<div class="plan-ex-search">
										<input
											class="create-input"
											type="text"
											placeholder="Übung suchen…"
											autocomplete="off"
											.value=${ex.searchText}
											@focus=${() => this.updateCreatePlanExercise(i, 'activeDropdown', true)}
											@input=${(e: Event) => {
												const val = (e.target as HTMLInputElement).value;
												this.createPlanExercises = this.createPlanExercises.map((e2, idx) =>
													idx === i
														? {
																...e2,
																searchText: val,
																exerciseId: '',
																activeDropdown: true
															}
														: e2
												);
											}}
											@blur=${() => {
												setTimeout(() => {
													this.createPlanExercises = this.createPlanExercises.map(
														(e2, idx) => (idx === i ? { ...e2, activeDropdown: false } : e2)
													);
												}, 150);
											}}
										/>
										${ex.activeDropdown && suggestions.length > 0
											? html`
													<ul class="exercise-dropdown-mini">
														${suggestions.map(
															s => html`
																<li
																	@mousedown=${() =>
																		this.selectCreatePlanExercise(i, s)}
																>
																	${s.name}
																	${s.muscleGroup
																		? html`<span class="ex-meta"
																				>${s.muscleGroup}</span
																			>`
																		: nothing}
																</li>
															`
														)}
													</ul>
												`
											: nothing}
									</div>
									<input
										class="create-input plan-ex-num"
										type="number"
										min="1"
										title="Sets"
										placeholder="Sets"
										.value=${String(ex.sets)}
										@input=${(e: Event) =>
											this.updateCreatePlanExercise(
												i,
												'sets',
												Math.max(1, Number((e.target as HTMLInputElement).value))
											)}
									/>
									<input
										class="create-input plan-ex-num"
										type="number"
										min="1"
										title="Reps"
										placeholder="Reps"
										.value=${String(ex.reps)}
										@input=${(e: Event) =>
											this.updateCreatePlanExercise(
												i,
												'reps',
												Math.max(1, Number((e.target as HTMLInputElement).value))
											)}
									/>
									<button class="btn-remove-plan-ex" @click=${() => this.removeCreatePlanExercise(i)}>
										✕
									</button>
								</div>
							`;
						})}
						${this.createPlanError ? html`<p class="create-error">${this.createPlanError}</p>` : nothing}
					</div>
					<div class="confirm-actions">
						<button class="confirm-btn confirm-btn--cancel" @click=${() => (this.showCreatePlan = false)}>
							Abbrechen
						</button>
						<button class="confirm-btn confirm-btn--create" @click=${() => void this.submitCreatePlan()}>
							Erstellen
						</button>
					</div>
				</div>
			</div>
		`;
	}

	private renderEditPlanOverlay() {
		if (!this.editingPlan) return nothing;
		const plan = this.editingPlan;
		const q = this.addExSearch.toLowerCase();
		const suggestions = this.exercises.filter(a => q.length === 0 || a.name.toLowerCase().includes(q)).slice(0, 15);

		return html`
			<div class="confirm-overlay">
				<div class="create-dialog">
					<p class="confirm-title">${plan.name} – Übungen</p>

					<div class="plan-ex-list">
						${plan.exercises.length === 0
							? html`<p class="plan-ex-empty">Noch keine Übungen in diesem Plan.</p>`
							: plan.exercises
									.slice()
									.sort((a, b) => a.exerciseOrder - b.exerciseOrder)
									.map(
										pe => html`
											<div class="plan-exercise-row">
												<span class="plan-ex-name">${this.exName(pe.exerciseId)}</span>
												<span class="plan-ex-stats">
													${pe.targetSets ? `${pe.targetSets}×` : ''}${pe.targetReps
														? `${pe.targetReps}`
														: ''}${pe.targetWeight ? ` · ${pe.targetWeight} kg` : ''}
												</span>
												<button
													class="btn-remove-plan-ex"
													@click=${() => void this.removeExerciseFromPlan(plan.id, pe.id)}
												>
													✕
												</button>
											</div>
										`
									)}
					</div>

					<div class="add-exercise-form">
						<p class="add-ex-label">Übung hinzufügen</p>
						<div class="plan-ex-row">
							<div class="plan-ex-search">
								<input
									class="create-input"
									type="text"
									placeholder="Übung suchen…"
									autocomplete="off"
									.value=${this.addExSearch}
									@focus=${() => (this.addExDropdown = true)}
									@input=${(e: Event) => {
										this.addExSearch = (e.target as HTMLInputElement).value;
										this.addExId = '';
										this.addExDropdown = true;
									}}
									@blur=${() => {
										setTimeout(() => (this.addExDropdown = false), 150);
									}}
								/>
								${this.addExDropdown && suggestions.length > 0
									? html`
											<ul class="exercise-dropdown-mini">
												${suggestions.map(
													s => html`
														<li
															@mousedown=${() => {
																this.addExId = s.id;
																this.addExSearch = s.name;
																this.addExDropdown = false;
																this.addExError = '';
															}}
														>
															${s.name}
															${s.muscleGroup
																? html`<span class="ex-meta">${s.muscleGroup}</span>`
																: nothing}
														</li>
													`
												)}
											</ul>
										`
									: nothing}
							</div>
							<input
								class="create-input plan-ex-num"
								type="number"
								min="1"
								title="Sets"
								placeholder="Sets"
								.value=${String(this.addExSets)}
								@input=${(e: Event) =>
									(this.addExSets = Math.max(1, Number((e.target as HTMLInputElement).value)))}
							/>
							<input
								class="create-input plan-ex-num"
								type="number"
								min="1"
								title="Reps"
								placeholder="Reps"
								.value=${String(this.addExReps)}
								@input=${(e: Event) =>
									(this.addExReps = Math.max(1, Number((e.target as HTMLInputElement).value)))}
							/>
							<button class="btn-add-plan-ex" @click=${() => void this.addExerciseToPlan()}>+</button>
						</div>
						${this.addExError ? html`<p class="create-error">${this.addExError}</p>` : nothing}
					</div>

					<div class="confirm-actions" style="margin-top:1rem">
						<button class="confirm-btn confirm-btn--create" @click=${() => (this.editingPlan = null)}>
							Fertig
						</button>
					</div>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'admin-workouts': AdminWorkouts;
	}
}
