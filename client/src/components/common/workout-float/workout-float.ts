/**
 * Autor: Justus Heinz

 */
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { Router, routerContext } from '../../../router.js';
import { workoutStore } from '../../pages/users/WorkoutSession/workout-store.js';
import componentStyle from './workout-float.css?inline';

@customElement('workout-float')
export class WorkoutFloat extends LitElement {
	static styles = [componentStyle];

	@consume({ context: routerContext }) private router!: Router;

	@state() private _tick = 0;

	private get onSessionPage(): boolean {
		const p = window.location.pathname;
		return p.includes('/workouts/') && p.endsWith('/start');
	}

	override connectedCallback() {
		super.connectedCallback();
		workoutStore.addEventListener('change', this.storeListener);
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		workoutStore.removeEventListener('change', this.storeListener);
	}

	render() {
		if (!workoutStore.isActive || this.onSessionPage) return html``;

		return html`
			<div class="float-bar">
				<div class="float-info">
					<span class="float-icon">&#x1F4AA;</span>
					<div class="float-text">
						<span class="float-name">${workoutStore.planName || 'Workout'}</span>
						<span class="float-timer">${this.formatTime(workoutStore.elapsedSeconds)}</span>
					</div>
				</div>
				<a
					class="float-btn"
					href="/workouts/${workoutStore.planId}/start"
					@click=${(e: Event) => {
						e.preventDefault();
						this.router.push(`/workouts/${workoutStore.planId}/start`);
					}}
					>Weiter</a
				>
			</div>
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
}

declare global {
	interface HTMLElementTagNameMap {
		'workout-float': WorkoutFloat;
	}
}
