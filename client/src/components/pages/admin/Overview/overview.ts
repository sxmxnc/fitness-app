/**
 * Autor: Luca Lammers

 */

/** Ressources from the Internet used here:
 * BENTO-Grid-Layout: https://www.makeitgrid.com/
 * Ringanimation: https://codepen.io/andresdhn/pen/RwPbyxy
 * Counting animation: https://css-tricks.com/animating-number-counters/?utm_source=chatgpt.com
 * Line Chart: https://www.chartjs.org/docs/latest/samples/line/line.html
 * Bar Chart: https://www.chartjs.org/docs/latest/samples/bar/vertical.html
 */
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './overview.css?inline';
import '../common/header/admin-header';
import '../common/nav/admin-nav';
import { BASE_API } from '../../../../config.js';
import './components/active-sessions/active-sessions';
import './components/sessions-by-day/sessions-by-day';
import './components/popular-times/popular-times';
import './components/user-activity/user-activity';
import './components/daily-sessions/daily-sessions';
import { requireAdminAuth } from '../common/admin-auth.js';
import { HttpClient, httpClientContext } from '../../../../http-client.js';

/** Describes the admin stats shape. */
interface AdminStats {
	activeSessions: number;
	userCount: number;
	sessionsByDay: { day: number; count: number }[];
	popularTimes: { hour: number; count: number }[];
}

/** Defines the admin overview Lit component. */
@customElement('admin-overview')
export class AdminOverview extends LitElement {
	static readonly styles = [componentStyle];

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private stats: AdminStats | null = null;

	/** Initializes component state after the element is connected. */
	override connectedCallback() {
		super.connectedCallback();
		void this.loadStats();
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<admin-header></admin-header>
			<div class="page-content">
				<div class="bento" data-testid="admin-dashboard-bento">
					<bento-active-sessions
						class="card-3"
						data-testid="card-active-sessions"
						.count=${this.stats?.activeSessions ?? 0}
					></bento-active-sessions>
					<bento-user-activity class="card-2" data-testid="card-user-activity"></bento-user-activity>
					<bento-sessions-by-day
						class="card-1"
						data-testid="card-sessions-by-day"
						.data=${this.stats?.sessionsByDay ?? []}
					></bento-sessions-by-day>
					<bento-popular-times
						class="card-0"
						data-testid="card-popular-times"
						.data=${this.stats?.popularTimes ?? []}
					></bento-popular-times>
					<bento-daily-sessions class="card-4" data-testid="card-daily-sessions"></bento-daily-sessions>
				</div>
			</div>
			<admin-nav></admin-nav>
		`;
	}

	/** Loads stats. */
	private async loadStats() {
		if (!(await requireAdminAuth(this.http))) return;
		try {
			const res = await this.http.get(`${BASE_API}/admin/stats`);
			this.stats = await res.json();
		} catch (err) {
			console.error('[AdminOverview] Statistiken konnten nicht geladen werden:', err);
		}
	}
}
