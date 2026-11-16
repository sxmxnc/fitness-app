/**
 * Autor: Justus Heinz

 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { BASE_API } from '../../../../../../config.js';
import { HttpClient, httpClientContext } from '../../../../../../http-client.js';
import componentStyle from './exercise-heatmap.css?inline';

type ExerciseSession = { planName: string | null; durationSeconds: number };
type ExerciseDay = { day: string; sessions: ExerciseSession[] };

@customElement('my-exercise-heatmap')
export class ExerciseHeatmapComponent extends LitElement {
	static readonly styles = componentStyle;

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private exerciseStats: Map<string, ExerciseSession[]> = new Map();
	@state() private exerciseLoading = true;
	@state() private exerciseTooltip: { lines: string[]; x: number; y: number } | null = null;

	override connectedCallback() {
		super.connectedCallback();
		void this.loadExerciseStats();
	}

	render() {
		const weeks = this.buildGrid();
		return html`
			<div class="dashboard-card">
				<div class="card-header">
					<h2>Exercise</h2>
					<span class="card-subtitle">Trainierte Workouts im vergangenen Jahr</span>
				</div>
				${this.exerciseLoading
					? html`<div class="loading-state">Daten werden geladen...</div>`
					: html`
							<div class="heatmap-wrapper">
								<div class="heatmap-body">
									${this.renderDayLabels()}
									<div class="heatmap-cols">
										${this.renderMonthLabels(weeks)} ${this.renderExerciseGrid(weeks)}
									</div>
								</div>
								${this.renderExerciseLegend()}
							</div>
							${this.renderExerciseTooltip()}
						`}
			</div>
		`;
	}

	private async loadExerciseStats() {
		if (!localStorage.getItem('userId')) return;
		const to = Date.now();
		const from = to - 52 * 7 * 24 * 60 * 60 * 1000;
		try {
			const res = await this.http.get(`${BASE_API}/workout-sessions/stats/by-day?from=${from}&to=${to}`);
			if (!res.ok) return;
			const data: ExerciseDay[] = await res.json();
			this.exerciseStats = new Map(data.map(d => [d.day, d.sessions]));
		} finally {
			this.exerciseLoading = false;
		}
	}

	private buildGrid(): { date: Date; dateStr: string }[][] {
		const todayStr = new Date().toISOString().slice(0, 10);
		const start = new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000);
		start.setUTCHours(0, 0, 0, 0);
		const dow = start.getUTCDay();
		// align to the preceding Monday so every week column starts on Mo
		const mondayOffset = dow === 0 ? -6 : 1 - dow;
		start.setUTCDate(start.getUTCDate() + mondayOffset);

		const weeks: { date: Date; dateStr: string }[][] = [];
		const cursor = new Date(start);
		while (cursor.toISOString().slice(0, 10) <= todayStr) {
			const week: { date: Date; dateStr: string }[] = [];
			for (let d = 0; d < 7; d++) {
				const dateStr = cursor.toISOString().slice(0, 10);
				week.push({ date: new Date(cursor), dateStr });
				cursor.setUTCDate(cursor.getUTCDate() + 1);
			}
			weeks.push(week);
		}
		return weeks;
	}

	private exerciseTotalSeconds(sessions: ExerciseSession[]): number {
		return sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
	}

	private exerciseColorLevel(totalSeconds: number): string {
		// thresholds in seconds: < 20 ignored, then 5 / 10 / 20 min bands
		if (totalSeconds < 20) return 'ex-level-0';
		if (totalSeconds < 300) return 'ex-level-1';
		if (totalSeconds < 600) return 'ex-level-2';
		if (totalSeconds < 1200) return 'ex-level-3';
		return 'ex-level-4';
	}

	private formatDuration(seconds: number): string {
		if (seconds < 60) return `${seconds} s`;
		return `${Math.round(seconds / 60)} min`;
	}

	private formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00Z');
		return d.toLocaleDateString('de-DE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}

	private onExerciseCellMouseEnter(e: MouseEvent, dateStr: string) {
		const sessions = this.exerciseStats.get(dateStr);
		if (!sessions || sessions.length === 0) return;
		const top3 = sessions.slice(0, 3);
		const extra = sessions.length - 3;
		const lines = top3.map(s => `${s.planName ?? 'Kein Plan'} (${this.formatDuration(s.durationSeconds)})`);
		if (extra > 0) lines.push(`+${extra} mehr`);
		lines.push(this.formatDate(dateStr));
		// position uses raw viewport coordinates because the tooltip uses position: fixed
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		this.exerciseTooltip = {
			lines,
			x: rect.left + rect.width / 2,
			y: rect.top - 8
		};
	}

	private onExerciseCellMouseLeave() {
		this.exerciseTooltip = null;
	}

	private renderExerciseTooltip() {
		if (!this.exerciseTooltip) return '';
		return html`
			<div
				class="tooltip tooltip-multiline"
				style="left:${this.exerciseTooltip.x}px; top:${this.exerciseTooltip.y}px"
			>
				${this.exerciseTooltip.lines.join('\n')}
			</div>
		`;
	}

	private renderMonthLabels(weeks: { date: Date; dateStr: string }[][]): ReturnType<typeof html> {
		const labels: { label: string; col: number }[] = [];
		let lastMonth = -1;
		weeks.forEach((week, i) => {
			const month = week[0].date.getMonth();
			if (month !== lastMonth) {
				labels.push({ label: week[0].date.toLocaleDateString('de-DE', { month: 'short' }), col: i });
				lastMonth = month;
			}
		});
		return html`
			<div class="month-labels" style="grid-template-columns: repeat(${weeks.length}, 1fr)">
				${labels.map(
					({ label, col }) => html`
						<span class="month-label" style="grid-column: ${col + 1}">${label}</span>
					`
				)}
			</div>
		`;
	}

	private renderExerciseGrid(weeks: { date: Date; dateStr: string }[][]): ReturnType<typeof html> {
		return html`
			<div class="heatmap-grid" style="grid-template-columns: repeat(${weeks.length}, 1fr)">
				${weeks.map(
					week => html`
						<div class="week-col">
							${week.map(({ dateStr }) => {
								const sessions = this.exerciseStats.get(dateStr) ?? [];
								const totalSec = this.exerciseTotalSeconds(sessions);
								const future = dateStr > new Date().toISOString().slice(0, 10);
								const level = future ? 'future' : this.exerciseColorLevel(totalSec);
								return html`
									<div
										class="day-cell ${level}"
										@mouseenter=${(e: MouseEvent) =>
											!future && sessions.length > 0 && this.onExerciseCellMouseEnter(e, dateStr)}
										@mouseleave=${() => this.onExerciseCellMouseLeave()}
									></div>
								`;
							})}
						</div>
					`
				)}
			</div>
		`;
	}

	// AI-Generated
	private renderDayLabels(): ReturnType<typeof html> {
		return html`
			<div class="day-labels">
				<span>Mo</span>
				<span></span>
				<span>Mi</span>
				<span></span>
				<span>Fr</span>
				<span></span>
				<span>So</span>
			</div>
		`;
	}

	// AI-Generated
	private renderExerciseLegend(): ReturnType<typeof html> {
		return html`
			<div class="legend">
				<span>Weniger</span>
				<div class="day-cell ex-level-0"></div>
				<div class="day-cell ex-level-1"></div>
				<div class="day-cell ex-level-2"></div>
				<div class="day-cell ex-level-3"></div>
				<div class="day-cell ex-level-4"></div>
				<span>Mehr</span>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-exercise-heatmap': ExerciseHeatmapComponent;
	}
}
