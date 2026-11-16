/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import componentStyle from './app.css?inline';
import { provide } from '@lit/context';
import { Router, routerContext } from '../../router';
import { HttpClient, httpClientContext } from '../../http-client';
import '../pages/Home/Page/landing/landing.js';
import '../pages/Home/Page/Login/login.js';
import '../pages/Home/Page/Login/forgot-password.js';
import '../pages/users/Profile/profile.js';
import '../pages/users/Dashboard/dashboard.js';
import '../pages/users/Workout/workout-list.js';
import '../pages/users/WorkoutSession/workout-session.js';
import '../pages/admin/Overview/overview.js';
import '../pages/admin/UserOverview/UserOverview.js';
import '../pages/admin/WorkoutOverview/WorkoutOverview.js';
import '../pages/admin/FoodtrackingOverview/FoodtrackingOverview.js';
import '../pages/users/FoodTracking/food-tracking.js';
import '../common/session-timeout/session-timeout.js';
import '../common/workout-float/workout-float.js';

@customElement('app-root')
export class AppComponent extends LitElement {
	static readonly styles = [componentStyle];

	@provide({ context: httpClientContext })
	httpClient = new HttpClient();

	@provide({ context: routerContext })
	@state()
	router = new Router(
		this,
		[
			{ path: '/', render: () => html`<app-home></app-home>` },
			{ path: '/login', render: () => html`<app-login></app-login>` },
			{ path: '/forgot-password', render: () => html`<forgot-password></forgot-password>` },
			{ path: '/profile', render: () => html`<app-profile></app-profile>` },
			{ path: '/stats', render: () => html`<app-dashboard></app-dashboard>` },
			{ path: '/workouts/:id/start', render: () => html`<app-workout-session></app-workout-session>` },
			{ path: '/workouts', render: () => html`<app-workout-list></app-workout-list>` },
			{ path: '/admin/overview', render: () => html`<admin-overview></admin-overview>` },
			{ path: '/admin/profiles', render: () => html`<admin-profiles></admin-profiles>` },
			{ path: '/admin/workouts', render: () => html`<admin-workouts></admin-workouts>` },
			{ path: '/admin/foodtracking', render: () => html`<admin-foodtracking></admin-foodtracking>` },
			{ path: '/foodtracking', render: () => html`<app-foodtracking></app-foodtracking>` }
		],
		{
			fallback: { render: () => html`Unbekannte Seite` }
		}
	);

	render() {
		return html`
			<main>${this.router.outlet()}</main>
			<workout-float></workout-float>
			<session-timeout></session-timeout>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'app-root': AppComponent;
	}
}
