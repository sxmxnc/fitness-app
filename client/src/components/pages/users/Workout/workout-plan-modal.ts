/**
 * Autor: Justus Heinz

 */

import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../../http-client.js';
import '../../../common/error-message/error-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';
import modalStyle from './workout-modal.css?inline';
import formStyle from './workout-form.css?inline';
import workoutPlanService, { type WorkoutPlan, type AvailableExercise } from './workout-plan.service.js';

type ModalExercise = {
	name: string;
	sets: number;
	reps: number;
	weight: number;
	planExerciseId?: string;
	exerciseId?: string;
};

const DEFAULT_EXERCISE: ModalExercise = { name: '', sets: 3, reps: 10, weight: 0 };

@customElement('workout-plan-modal')
export class WorkoutPlanModal extends LitElement {
	static styles = [
		modalStyle,
		formStyle,
		css`
			:host {
				display: contents;
			}
		`
	];

	@consume({ context: httpClientContext }) private http!: HttpClient;

	@query('error-message') private readonly errorMsg!: ErrorMessage;

	@state() private visible = false;
	@state() private planName = '';
	@state() private exercises: ModalExercise[] = [{ ...DEFAULT_EXERCISE }];
	@state() private errors: { planName: boolean; exercises: boolean[] } = { planName: false, exercises: [false] };
	@state() private saving = false;
	@state() private editingPlanId: string | null = null;
	@state() private editingClassicId: string | null = null;
	@state() private availableExercises: AvailableExercise[] = [];
	@state() private activeDropdown: number | null = null;

	private get userId() {
		return localStorage.getItem('userId') ?? '';
	}
	private get isClassicEdit() {
		return !!this.editingClassicId;
	}
	private get isUserEdit() {
		return !!this.editingPlanId;
	}
	private get modalTitle() {
		if (this.isClassicEdit) return 'Classic Plan anpassen';
		if (this.isUserEdit) return 'Edit Workout Plan';
		return 'Create Workout Plan';
	}
	private get modalSaveLabel() {
		if (this.saving) return 'Wird gespeichert…';
		if (this.isClassicEdit) return 'Als eigene Version speichern';
		if (this.isUserEdit) return 'Plan aktualisieren';
		return 'Plan speichern';
	}

	open() {
		this.planName = '';
		this.exercises = [{ ...DEFAULT_EXERCISE }];
		this.errors = { planName: false, exercises: [false] };
		this.saving = false;
		this.editingPlanId = null;
		this.editingClassicId = null;
		this.visible = true;
		void this.loadAvailableExercises();
	}

	async openForEdit(plan: WorkoutPlan) {
		this.editingPlanId = plan.id;
		this.editingClassicId = null;
		await this.initFromPlan(plan);
	}

	async openForClassic(plan: WorkoutPlan) {
		this.editingClassicId = plan.id;
		this.editingPlanId = null;
		await this.initFromPlan(plan);
	}

	// AI-Generated
	render() {
		return html`
			<error-message></error-message>
			${this.visible
				? html`
						<div
							class="modal-overlay"
							@click=${(e: Event) => {
								if (e.target === e.currentTarget) this.close();
							}}
						>
							<div class="modal" data-testid="create-plan-modal">
								<div class="modal-header">
									<h2>${this.modalTitle}</h2>
									<button class="btn-icon-close" @click=${this.close} aria-label="Schließen">
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<line x1="18" y1="6" x2="6" y2="18" />
											<line x1="6" y1="6" x2="18" y2="18" />
										</svg>
									</button>
								</div>

								<div class="modal-body">
									<div class="form-group ${this.errors.planName ? 'has-error' : ''}">
										<label>Planname *</label>
										<input
											type="text"
											required
											data-testid="plan-name-input"
											placeholder="z. B. Push Day"
											.value=${this.planName}
											@input=${(e: Event) => {
												this.planName = (e.target as HTMLInputElement).value;
												this.errors = { ...this.errors, planName: false };
											}}
										/>
										${this.errors.planName
											? html`<span class="field-error">Pflichtfeld</span>`
											: ''}
									</div>

									<div class="exercises-section">
										<div class="exercises-header">
											<span class="section-label">Übungen</span>
											<button
												class="btn-add-exercise"
												data-testid="add-exercise-btn"
												@click=${this.addExercise}
											>
												+ Übung hinzufügen
											</button>
										</div>

										${this.exercises.map((ex, i) => {
											const q = ex.name.toLowerCase();
											const suggestions = this.availableExercises
												.filter(a => q.length === 0 || a.name.toLowerCase().includes(q))
												.slice(0, 15);
											return html`
												<div class="exercise-block" data-testid="exercise-row">
													<div class="exercise-name-row">
														<div
															class="form-group flex-1 ${this.errors.exercises[i]
																? 'has-error'
																: ''}"
														>
															<label>Übungsname *</label>
															<div class="exercise-autocomplete">
																<input
																	type="text"
																	data-testid="exercise-name-input"
																	placeholder="Übung suchen oder eingeben…"
																	autocomplete="off"
																	.value=${ex.name}
																	@focus=${() => {
																		this.activeDropdown = i;
																	}}
																	@input=${(e: Event) => {
																		const val = (e.target as HTMLInputElement)
																			.value;
																		this.exercises = this.exercises.map(
																			(e2, idx) =>
																				idx === i
																					? {
																							...e2,
																							name: val,
																							exerciseId: undefined
																						}
																					: e2
																		);
																		const errs = [...this.errors.exercises];
																		errs[i] = false;
																		this.errors = {
																			...this.errors,
																			exercises: errs
																		};
																		this.activeDropdown = i;
																	}}
																	@blur=${() => {
																		setTimeout(() => {
																			if (this.activeDropdown === i)
																				this.activeDropdown = null;
																		}, 150);
																	}}
																/>
																${this.activeDropdown === i && suggestions.length > 0
																	? html`
																			<ul class="exercise-dropdown">
																				${suggestions.map(
																					s => html`
																						<li
																							@mousedown=${() =>
																								this.selectExercise(
																									i,
																									s
																								)}
																						>
																							<span
																								class="exercise-dropdown-name"
																								>${s.name}</span
																							>
																							${s.muscleGroup
																								? html`<span
																										class="exercise-dropdown-meta"
																										>${s.muscleGroup}</span
																									>`
																								: ''}
																						</li>
																					`
																				)}
																			</ul>
																		`
																	: ''}
															</div>
															${this.errors.exercises[i]
																? html`<span class="field-error">Pflichtfeld</span>`
																: ''}
														</div>
														${!ex.planExerciseId || this.exercises.length > 1
															? html`
																	<button
																		class="btn-remove-exercise"
																		data-testid="remove-exercise-btn"
																		@click=${() => this.removeExercise(i)}
																		aria-label="Übung entfernen"
																	>
																		<svg
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2.5"
																			stroke-linecap="round"
																		>
																			<line x1="18" y1="6" x2="6" y2="18" />
																			<line x1="6" y1="6" x2="18" y2="18" />
																		</svg>
																	</button>
																`
															: ''}
													</div>
													<div class="exercise-fields">
														<div class="form-group small">
															<label>Sets</label>
															<input
																type="number"
																min="1"
																.value=${String(ex.sets)}
																@keydown=${(e: KeyboardEvent) => {
																	if (e.key === 'e' || e.key === 'E')
																		e.preventDefault();
																}}
																@input=${(e: Event) =>
																	this.updateExercise(
																		i,
																		'sets',
																		Math.max(
																			1,
																			Number((e.target as HTMLInputElement).value)
																		)
																	)}
															/>
														</div>
														<div class="form-group small">
															<label>Reps</label>
															<input
																type="number"
																min="1"
																.value=${String(ex.reps)}
																@keydown=${(e: KeyboardEvent) => {
																	if (e.key === 'e' || e.key === 'E')
																		e.preventDefault();
																}}
																@input=${(e: Event) =>
																	this.updateExercise(
																		i,
																		'reps',
																		Math.max(
																			1,
																			Number((e.target as HTMLInputElement).value)
																		)
																	)}
															/>
														</div>
														<div class="form-group small">
															<label>Weight (kg)</label>
															<input
																type="number"
																min="0"
																step="0.5"
																.value=${String(ex.weight)}
																@keydown=${(e: KeyboardEvent) => {
																	if (e.key === 'e' || e.key === 'E')
																		e.preventDefault();
																}}
																@input=${(e: Event) =>
																	this.updateExercise(
																		i,
																		'weight',
																		Math.max(
																			0,
																			Number((e.target as HTMLInputElement).value)
																		)
																	)}
															/>
														</div>
													</div>
												</div>
											`;
										})}
									</div>
								</div>

								<div class="modal-footer">
									<button class="btn-cancel" @click=${this.close}>Abbrechen</button>
									<button
										class="btn-save-plan"
										data-testid="save-plan-btn"
										?disabled=${this.saving}
										@click=${this.handleSave}
									>
										${this.modalSaveLabel}
									</button>
								</div>
							</div>
						</div>
					`
				: ''}
		`;
	}

	private async initFromPlan(plan: WorkoutPlan) {
		this.planName = plan.name;
		this.saving = false;
		this.exercises = [];
		this.errors = { planName: false, exercises: [] };
		const planExercises = await workoutPlanService.getPlanExercises(this.http, this.userId, plan.id);
		this.exercises = planExercises.map(ex => ({
			name: ex.exerciseName,
			sets: ex.targetSets ?? 3,
			reps: ex.targetReps ?? 10,
			weight: ex.targetWeight ?? 0,
			...(plan.isSystemProperty ? {} : { planExerciseId: ex.id, exerciseId: ex.exerciseId })
		}));
		this.errors = { planName: false, exercises: this.exercises.map(() => false) };
		this.visible = true;
		void this.loadAvailableExercises();
	}

	private close() {
		this.visible = false;
		this.saving = false;
		this.editingPlanId = null;
		this.editingClassicId = null;
	}

	private async loadAvailableExercises() {
		if (this.availableExercises.length > 0) return;
		this.availableExercises = await workoutPlanService.getAvailableExercises(this.http, this.userId);
	}

	private selectExercise(i: number, exercise: AvailableExercise) {
		this.exercises = this.exercises.map((ex, idx) =>
			idx === i ? { ...ex, name: exercise.name, exerciseId: exercise.id } : ex
		);
		const errs = [...this.errors.exercises];
		errs[i] = false;
		this.errors = { ...this.errors, exercises: errs };
		this.activeDropdown = null;
	}

	private addExercise() {
		this.exercises = [...this.exercises, { ...DEFAULT_EXERCISE }];
		this.errors = { ...this.errors, exercises: [...this.errors.exercises, false] };
		this.updateComplete.then(() => {
			const blocks = this.shadowRoot?.querySelectorAll('.exercise-block');
			if (blocks && blocks.length > 0) {
				const lastBlock = blocks[blocks.length - 1];
				lastBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				lastBlock.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
			}
		});
	}

	private removeExercise(i: number) {
		this.exercises = this.exercises.filter((_, idx) => idx !== i);
		this.errors = { ...this.errors, exercises: this.errors.exercises.filter((_, idx) => idx !== i) };
	}

	private updateExercise(i: number, field: keyof ModalExercise, value: string | number) {
		this.exercises = this.exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex));
	}

	private validate(): boolean {
		const planNameErr = !this.planName.trim();
		this.errors = { planName: planNameErr, exercises: this.exercises.map(() => false) };
		return !planNameErr;
	}

	private async createExercisesAndAddToPlan(planId: string) {
		const exerciseIds: string[] = [];
		const exercises = this.exercises.filter(ex => ex.name.trim());
		for (const ex of exercises) {
			if (ex.exerciseId) {
				exerciseIds.push(ex.exerciseId);
			} else {
				const created = await workoutPlanService.createExercise(this.http, this.userId, ex.name.trim());
				exerciseIds.push(created.id);
			}
		}
		for (let i = 0; i < exercises.length; i++) {
			const ex = exercises[i];
			await workoutPlanService.addExerciseToPlan(
				this.http,
				this.userId,
				planId,
				exerciseIds[i],
				i + 1,
				ex.sets,
				ex.reps,
				ex.weight
			);
		}
	}

	private async saveNew() {
		if (!this.validate() || this.saving) return;
		this.saving = true;
		try {
			const plan = await workoutPlanService.createPlan(this.http, this.userId, this.planName.trim());
			await this.createExercisesAndAddToPlan(plan.id);
			this.close();
			this.dispatchEvent(
				new CustomEvent('plan-saved', {
					detail: { message: 'Plan gespeichert!' },
					bubbles: true,
					composed: true
				})
			);
		} catch {
			this.errorMsg.show('Fehler beim Speichern des Plans.');
			this.saving = false;
		}
	}

	private async saveEdited() {
		if (!this.validate() || this.saving || !this.editingPlanId) return;
		this.saving = true;
		const planId = this.editingPlanId;
		try {
			await workoutPlanService.updatePlan(this.http, this.userId, planId, this.planName.trim());
			for (const ex of this.exercises) {
				if (ex.planExerciseId) {
					await workoutPlanService.removePlanExercise(this.http, this.userId, planId, ex.planExerciseId);
				}
			}
			await this.createExercisesAndAddToPlan(planId);
			this.close();
			this.dispatchEvent(
				new CustomEvent('plan-saved', {
					detail: { message: 'Plan aktualisiert!' },
					bubbles: true,
					composed: true
				})
			);
		} catch {
			this.errorMsg.show('Fehler beim Aktualisieren des Plans.');
			this.saving = false;
		}
	}

	private async saveClassic() {
		if (!this.validate() || this.saving || !this.editingClassicId) return;
		this.saving = true;
		const classicId = this.editingClassicId;
		try {
			const plan = await workoutPlanService.createPlan(this.http, this.userId, this.planName.trim());
			await this.createExercisesAndAddToPlan(plan.id);
			this.close();
			this.dispatchEvent(
				new CustomEvent('classic-saved', {
					detail: { classicId, newPlanId: plan.id, message: 'Classic Plan angepasst!' },
					bubbles: true,
					composed: true
				})
			);
		} catch {
			this.errorMsg.show('Fehler beim Speichern.');
			this.saving = false;
		}
	}

	private handleSave() {
		if (this.isClassicEdit) return this.saveClassic();
		if (this.isUserEdit) return this.saveEdited();
		return this.saveNew();
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'workout-plan-modal': WorkoutPlanModal;
	}
}
