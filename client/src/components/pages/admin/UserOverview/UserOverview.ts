/**
 * Autor: Luca Lammers

 */
import { LitElement, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './UserOverview.css?inline';
import '../common/nav/admin-nav';
import '../common/header/admin-header';
import { BASE_API } from '../../../../config.js';
import { requireAdminAuth } from '../common/admin-auth.js';
import { HttpClient, httpClientContext } from '../../../../http-client.js';
import './user-popup/UserPopup';
import type { UserStats, Session } from './user-popup/UserPopup';
import type { FoodStats } from './user-popup/components/popup-tab-food';
import '../../../common/success-message/success-message.js';
import '../../../common/error-message/error-message.js';
import type { SuccessMessage } from '../../../common/success-message/success-message.js';
import type { ErrorMessage } from '../../../common/error-message/error-message.js';

/** Describes the user list item shape. */
interface UserListItem {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	createdAt: number;
	isDeactivated: boolean;
}

/** Describes the sort key shape. */
type SortKey = 'date-asc' | 'date-desc' | 'active' | 'inactive';

/** Defines admin profiles. */
@customElement('admin-profiles')
export class AdminProfiles extends LitElement {
	static readonly styles = [componentStyle];

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@query('success-message') private readonly successMsg!: SuccessMessage;
	@query('error-message') private readonly errorMsg!: ErrorMessage;

	@state() private users: UserListItem[] = [];
	@state() private loading = true;
	@state() private error = '';
	@state() private search = '';
	@state() private sort: SortKey = 'date-desc';
	@state() private popup: UserStats | null = null;
	@state() private popupLoading = false;
	@state() private sessions: Session[] = [];
	@state() private foodStats: FoodStats | null = null;

	/**
	 * Handles filtered users.
	 * @returns {UserListItem[]} The operation result.
	 */
	private get filteredUsers(): UserListItem[] {
		const q = this.search.toLowerCase();
		let list = this.users.filter(
			/**
			 * Selects items that should remain in the derived collection.
			 * @param {UserListItem} u u.
			 * @returns {boolean} True when the condition is met.
			 */
			u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
		);
		if (this.sort === 'active')
			list = list.filter(
				/**
				 * Selects items that should remain in the derived collection.
				 * @param {UserListItem} u u.
				 * @returns {boolean} True when the condition is met.
				 */
				u => !u.isDeactivated
			);
		if (this.sort === 'inactive')
			list = list.filter(
				/**
				 * Selects items that should remain in the derived collection.
				 * @param {UserListItem} u u.
				 * @returns {boolean} True when the condition is met.
				 */
				u => u.isDeactivated
			);
		if (this.sort === 'date-asc')
			list = list.sort(
				/**
				 * Compares two items for the requested display order.
				 * @param {UserListItem} a a.
				 * @param {UserListItem} b b.
				 * @returns {number} The calculated number.
				 */
				(a, b) => Number(a.createdAt) - Number(b.createdAt)
			);
		else
			list = list.sort(
				/**
				 * Compares two items for the requested display order.
				 * @param {UserListItem} a a.
				 * @param {UserListItem} b b.
				 * @returns {number} The calculated number.
				 */
				(a, b) => Number(b.createdAt) - Number(a.createdAt)
			);
		return list;
	}

	/** Initializes component state after the element is connected. */
	override connectedCallback() {
		super.connectedCallback();
		void this.init();
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<admin-header></admin-header>
			<success-message></success-message>
			<error-message></error-message>
			<div class="page-header">
				<div class="controls">
					<div class="search-wrap">
						<svg class="search-icon" viewBox="0 0 20 20" fill="none">
							<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6" />
							<path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
						</svg>
						<input
							class="search-input"
							data-testid="profiles-search-input"
							type="text"
							placeholder="Name suchen..."
							.value=${this.search}
							@input=${
								/**
								 * Handles the inline callback for the surrounding UI operation.
								 * @param {Event} e DOM event emitted by the UI.
								 * @returns {string} The formatted string.
								 */
								(e: Event) => (this.search = (e.target as HTMLInputElement).value)
							}
						/>
					</div>
					<div class="sort-pills" data-testid="profiles-sort-pills">
						${(['date-desc', 'date-asc', 'active', 'inactive'] as SortKey[]).map(
							/**
							 * Transforms one item for the rendered or derived collection.
							 * @param {SortKey} key key.
							 * @returns {TemplateResult<1>} The Lit template to render.
							 */
							key => html`
								<button
									class="sort-pill ${this.sort === key ? 'active' : ''}"
									data-testid="profiles-sort-${key}-btn"
									@click=${
										/**
										 * Handles the inline callback for the surrounding UI operation.
										 * @returns {SortKey} The operation result.
										 */
										() => (this.sort = key)
									}
								>
									${{
										'date-desc': 'Neueste',
										'date-asc': 'Älteste',
										'active': 'Aktiv',
										'inactive': 'Inaktiv'
									}[key]}
								</button>
							`
						)}
					</div>
				</div>
			</div>

			<div class="page-content">${this.renderContent()}</div>

			${this.popup !== null || this.popupLoading
				? html`<user-popup
						.user=${this.popup}
						.sessions=${this.sessions}
						.foodStats=${this.foodStats}
						.loading=${this.popupLoading}
						@close=${
							/** Handles the inline callback for the surrounding UI operation. */
							() => this.closePopup()
						}
					></user-popup>`
				: nothing}

			<admin-nav></admin-nav>
		`;
	}

	/** Initializes init. */
	private async init() {
		if (!(await requireAdminAuth(this.http))) return;
		this.loadUsers();
	}

	/**
	 * Renders content.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	private renderContent() {
		if (this.loading) {
			return html`<div class="loading" data-testid="profiles-loading">Laden...</div>`;
		}
		if (this.error) {
			return html`<div class="error-msg" data-testid="profiles-error-msg">${this.error}</div>`;
		}
		return html`<div class="user-list" data-testid="profiles-user-list">${this.renderUserList()}</div>`;
	}

	/**
	 * Renders user list.
	 * @returns {TemplateResult<1> | TemplateResult<1>[]} The Lit template to render.
	 */
	private renderUserList() {
		if (this.filteredUsers.length === 0) {
			return html`<div class="empty" data-testid="profiles-empty-state">Keine Benutzer gefunden</div>`;
		}
		return this.filteredUsers.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {UserListItem} user user.
			 * @returns {TemplateResult<1>} The Lit template to render.
			 */
			user => html`
				<div class="user-row" data-testid="profiles-user-row">
					<span class="user-name">${user.firstName} ${user.lastName}</span>
					<span class="user-date"> ${new Date(Number(user.createdAt)).toLocaleDateString('de-DE')} </span>
					<span
						class="status-badge ${user.isDeactivated ? 'inactive' : 'active'}"
						data-testid="profiles-user-status-badge"
					>
						${user.isDeactivated ? 'Inaktiv' : 'Aktiv'}
					</span>
					<div class="user-actions">
						<button
							class="btn btn-stats"
							data-testid="profiles-user-stats-btn"
							@click=${
								/** Handles the inline callback for the surrounding UI operation. */
								() => this.openStats(user)
							}
						>
							Statistiken anzeigen
						</button>
						<button
							class="btn ${user.isDeactivated ? 'btn-activate' : 'btn-deactivate'}"
							data-testid="profiles-user-toggle-btn"
							@click=${
								/** Handles the inline callback for the surrounding UI operation. */
								() => this.toggleUser(user)
							}
						>
							${user.isDeactivated ? 'Aktivieren' : 'Deaktivieren'}
						</button>
					</div>
				</div>
			`
		);
	}

	/**
	 * Loads users.
	 * @throws {Error} When validation fails or the operation cannot be completed.
	 */
	private async loadUsers() {
		try {
			const res = await this.http.get(`${BASE_API}/admin/stats/users`);
			if (!res.ok) throw new Error('Benutzer konnten nicht geladen werden');
			this.users = await res.json();
		} catch {
			this.error = 'Fehler beim Laden der Benutzer';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Opens stats.
	 * @param {UserListItem} user user.
	 */
	private async openStats(user: UserListItem) {
		this.popupLoading = true;
		this.popup = null;
		this.sessions = [];
		this.foodStats = null;
		try {
			const [statsRes, sessionsRes, foodStatsRes] = await Promise.all([
				this.http.get(`${BASE_API}/users/data/${user.id}`),
				this.http.get(`${BASE_API}/admin/session/${user.id}`),
				this.http.get(`${BASE_API}/admin/stats/food/${user.id}`)
			]);
			// fall back to user list data so the popup still opens even if stats fail
			this.popup = statsRes.ok
				? await statsRes.json()
				: {
						...user,
						weight: null,
						height: null,
						birthDate: null,
						dailyCalorieGoal: null,
						dailyProteinGoal: null,
						dailyFatGoal: null,
						dailyCarbsGoal: null
					};
			this.sessions = sessionsRes.ok ? await sessionsRes.json() : [];
			this.foodStats = foodStatsRes.ok ? await foodStatsRes.json() : null;
		} catch {
			this.popup = {
				...user,
				weight: null,
				height: null,
				birthDate: null,
				dailyCalorieGoal: null,
				dailyProteinGoal: null,
				dailyFatGoal: null,
				dailyCarbsGoal: null
			};
		} finally {
			this.popupLoading = false;
		}
	}

	/** Closes popup. */
	private closePopup() {
		this.popup = null;
		this.popupLoading = false;
		this.sessions = [];
		this.foodStats = null;
	}

	/**
	 * Toggles user.
	 * @param {UserListItem} user user.
	 * @throws {Error} When validation fails or the operation cannot be completed.
	 */
	private async toggleUser(user: UserListItem) {
		try {
			if (user.isDeactivated) {
				const res = await this.http.patch(`${BASE_API}/admin/stats/users/${user.id}/reactivate`);
				if (!res.ok) throw new Error('Benutzer konnte nicht reaktiviert werden');
			} else {
				const res = await this.http.delete(`${BASE_API}/users/${user.id}`);
				if (!res.ok) throw new Error('Benutzer konnte nicht deaktiviert werden');
			}
			// optimistic update — avoids a full reload of the user list
			this.users = this.users.map(
				/**
				 * Transforms one item for the rendered or derived collection.
				 * @param {UserListItem} u u.
				 * @returns {UserListItem} The operation result.
				 */
				u => (u.id === user.id ? { ...u, isDeactivated: !u.isDeactivated } : u)
			);
			const name = `${user.firstName} ${user.lastName}`;
			this.successMsg.show(
				user.isDeactivated ? `${name} wurde erfolgreich aktiviert.` : `${name} wurde erfolgreich deaktiviert.`
			);
		} catch {
			this.errorMsg.show('Fehler beim Ändern des Benutzerstatus.');
		}
	}
}
