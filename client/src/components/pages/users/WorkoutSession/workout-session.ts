/**
 * Autor: Justus Heinz

 */
import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import '../common/user-header/user-header';
import '../common/user-nav/user-nav';
import '../../../common/success-message/success-message.js';
import '../../../common/error-message/error-message.js';
import type { SuccessMessage } from '../../../common/success-message/success-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';
import componentStyle from './workout-session.css?inline';
import { workoutStore } from './workout-store.js';
import { Router, routerContext } from '../../../../router.js';
import { HttpClient, httpClientContext } from '../../../../http-client.js';
import workoutSessionService from './workout-session.service.js';

@customElement('app-workout-session')
export class WorkoutSession extends LitElement {
	static styles = [
		componentStyle,
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

	@state() private _tick = 0;
	@state() private finishing = false;
	@state() private finished = false;

	private get planId(): string {
		const routerParams = this.router?.params as Record<string, string> | undefined;
		return routerParams?.['id'] || window.location.pathname.split('/')[2] || '';
	}
	private get userId() {
		return localStorage.getItem('userId') ?? '';
	}

	override async connectedCallback() {
		super.connectedCallback();
		if (!localStorage.getItem('token') || !localStorage.getItem('userId')) {
			await this.router.push('/');
			return;
		}
		workoutStore.addEventListener('change', this.storeListener);

		if (workoutStore.isActive && workoutStore.planId === this.planId) {
			return;
		}
		await this.initSession();
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		workoutStore.removeEventListener('change', this.storeListener);
	}

	// AI-Generated
	render() {
		const { planName, elapsedSeconds, loading, exercises } = workoutStore;

		return html`
			<success-message></success-message>
			<error-message></error-message>
			${this.finished
				? ''
				: html`
						<app-header></app-header>
						<div class="page-content">
							<div class="session-container">
								<div class="session-topbar">
									<button
										class="btn-back"
										@click=${() => {
											this.router.push('/workouts');
										}}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<polyline points="15 18 9 12 15 6" />
										</svg>
										Zurück
									</button>
									<div class="session-meta">
										${planName ? html`<span class="session-plan-name">${planName}</span>` : ''}
										<span class="timer" data-testid="timer"
											>${this.formatTime(elapsedSeconds)}</span
										>
									</div>
								</div>

								${loading
									? html`<div class="loading-state">Workout wird vorbereitet…</div>`
									: html`
											<div class="exercises-list" data-testid="exercises-list">
												${exercises.map(
													(ex, exIdx) => html`
														<div class="exercise-section" data-testid="exercise-section">
															<div class="exercise-heading">
																<span class="exercise-name">${ex.name}</span>
																<span class="exercise-sets-count"
																	>${ex.sets.length}
																	Set${ex.sets.length !== 1 ? 's' : ''}</span
																>
															</div>
															<div class="sets-table">
																<div class="sets-header">
																	<span>Set</span>
																	<span>Reps</span>
																	<span>Weight (kg)</span>
																	<span></span>
																</div>
																${ex.sets.map(
																	(set, setIdx) => html`
																		<div class="set-row" data-testid="set-row">
																			<span class="set-num">${setIdx + 1}</span>
																			<input
																				type="number"
																				class="set-input"
																				min="1"
																				data-testid="reps-input"
																				.value=${String(set.reps)}
																				@keydown=${(e: KeyboardEvent) => {
																					if (e.key === 'e' || e.key === 'E')
																						e.preventDefault();
																				}}
																				@input=${(e: Event) =>
																					workoutStore.updateSet(
																						exIdx,
																						setIdx,
																						'reps',
																						Math.max(
																							1,
																							Number(
																								(
																									e.target as HTMLInputElement
																								).value
																							)
																						)
																					)}
																			/>
																			<input
																				type="number"
																				class="set-input"
																				min="0"
																				step="0.5"
																				data-testid="weight-input"
																				.value=${String(set.weight)}
																				@keydown=${(e: KeyboardEvent) => {
																					if (e.key === 'e' || e.key === 'E')
																						e.preventDefault();
																				}}
																				@input=${(e: Event) =>
																					workoutStore.updateSet(
																						exIdx,
																						setIdx,
																						'weight',
																						Math.max(
																							0,
																							Number(
																								(
																									e.target as HTMLInputElement
																								).value
																							)
																						)
																					)}
																			/>
																			<button
																				class="btn-remove-set"
																				data-testid="remove-set-btn"
																				?disabled=${ex.sets.length <= 1}
																				@click=${() =>
																					workoutStore.removeSet(
																						exIdx,
																						setIdx
																					)}
																				aria-label="Set entfernen"
																			>
																				<svg
																					viewBox="0 0 24 24"
																					fill="none"
																					stroke="currentColor"
																					stroke-width="2.5"
																					stroke-linecap="round"
																				>
																					<line
																						x1="5"
																						y1="12"
																						x2="19"
																						y2="12"
																					/>
																				</svg>
																			</button>
																		</div>
																	`
																)}
															</div>
															<button
																class="btn-add-set"
																data-testid="add-set-btn"
																@click=${() => workoutStore.addSet(exIdx)}
															>
																+ Set hinzufügen
															</button>
														</div>
													`
												)}
											</div>

											<button
												class="btn-finish"
												data-testid="finish-btn"
												?disabled=${this.finishing}
												@click=${this.finishWorkout}
											>
												${this.finishing ? 'Wird beendet…' : 'Workout beenden'}
											</button>
										`}
							</div>
						</div>
					`}
			<app-nav></app-nav>
		`;
	}

	private storeListener = () => {
		this._tick++;
	};

	private formatTime(s: number): string {
		const m = Math.floor(s / 60)
			.toString()
			.padStart(2, '0');
		const sec = (s % 60).toString().padStart(2, '0');
		return `${m}:${sec}`;
	}

	private async initSession() {
		workoutStore.isActive = true;
		workoutStore.planId = this.planId;
		workoutStore.loading = true;
		workoutStore.elapsedSeconds = 0;
		workoutStore.exercises = [];
		workoutStore.planName = '';
		workoutStore.notify();

		try {
			const session = await workoutSessionService.createSession(this.http, this.userId, this.planId);
			if (!session) {
				workoutStore.clear();
				this.errorMsg.show('Workout konnte nicht gestartet werden.');
				setTimeout(() => {
					this.router.push('/workouts');
				}, 2000);
				return;
			}
			workoutStore.sessionId = session.id;
			workoutStore.notify();

			const [planName, planExercises] = await Promise.all([
				workoutSessionService.fetchPlanName(this.http, this.userId, this.planId),
				workoutSessionService.fetchPlanExercises(this.http, this.userId, this.planId)
			]);

			workoutStore.planName = planName;
			workoutStore.notify();

			const sessionExercises = [];
			for (const pe of planExercises) {
				const sets = Math.max(1, Number(pe.targetSets) || 3);
				const reps = Math.max(1, Number(pe.targetReps) || 10);
				const weight = Math.max(0, Number(pe.targetWeight) || 0);

				const seResult = await workoutSessionService.addExerciseToSession(this.http, this.userId, session.id, {
					exerciseId: pe.exerciseId,
					exerciseOrder: pe.exerciseOrder,
					actualSets: sets,
					actualReps: reps,
					actualWeight: weight > 0 ? weight : null
				});

				sessionExercises.push({
					exerciseId: pe.exerciseId,
					name: pe.exerciseName,
					exerciseOrder: pe.exerciseOrder,
					sessionExerciseId: seResult?.id ?? null,
					sets: Array.from({ length: sets }, () => ({ reps, weight }))
				});
			}
			workoutStore.exercises = sessionExercises;
		} finally {
			workoutStore.loading = false;
			workoutStore.startTimer();
			workoutStore.notify();
		}
	}

	private async finishWorkout() {
		if (!workoutStore.sessionId || this.finishing) return;
		this.finishing = true;
		workoutStore.stopTimer();
		try {
			for (const ex of workoutStore.exercises) {
				if (!ex.sessionExerciseId) continue;
				await workoutSessionService.updateSessionExercise(
					this.http,
					this.userId,
					workoutStore.sessionId,
					ex.sessionExerciseId,
					{
						actualSets: ex.sets.length,
						actualReps: ex.sets[0]?.reps ?? null,
						actualWeight: (ex.sets[0]?.weight ?? 0) > 0 ? ex.sets[0].weight : null
					}
				);
			}

			const ok = await workoutSessionService.finishSession(this.http, this.userId, workoutStore.sessionId);
			if (ok) {
				workoutStore.clear();
				this.finished = true;
				this.successMsg.show('Workout abgeschlossen!');
				setTimeout(() => {
					this.router.push('/workouts');
				}, 1200);
			} else {
				this.errorMsg.show('Fehler beim Beenden des Workouts.');
				this.finishing = false;
				workoutStore.startTimer();
			}
		} catch {
			this.errorMsg.show('Server nicht erreichbar.');
			this.finishing = false;
			workoutStore.startTimer();
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'app-workout-session': WorkoutSession;
	}
}
