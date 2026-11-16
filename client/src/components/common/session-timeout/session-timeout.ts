/**
 * Autor: Luca Lammers

 */
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import componentStyle from './session-timeout.css?inline';
import { BASE_API } from '../../../config.js';
import { HttpClient, httpClientContext } from '../../../http-client.js';

const TIMEOUT_MS = 10 * 60 * 1000;
const WARNING_MS = 10 * 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

/** pages where the timeout dont run */
function isExcludedRoute(): boolean {
	const path = globalThis.location.pathname;
	return path === '/' || path === '/login' || path.startsWith('/admin');
}

/** Defines session timeout. */
@customElement('session-timeout')
export class SessionTimeout extends LitElement {
	static readonly styles = [componentStyle];

	@consume({ context: httpClientContext }) private readonly http!: HttpClient;

	@state() private showWarning = false;
	@state() private countdown = 10;

	private warningTimer: ReturnType<typeof setTimeout> | null = null;
	private logoutTimer: ReturnType<typeof setTimeout> | null = null;
	private countdownInterval: ReturnType<typeof setInterval> | null = null;

	/** Initializes component state after the element is connected. */
	override connectedCallback() {
		super.connectedCallback();
		ACTIVITY_EVENTS.forEach(
			/**
			 * Handles the inline callback for the surrounding UI operation.
			 * @param {'keydown' | 'mousedown' | 'mousemove' | 'scroll' | 'touchstart'} envent envent.
			 */
			envent => document.addEventListener(envent, this.boundReset, { passive: true })
		);
		globalThis.addEventListener('popstate', this.boundRouteChange);

		const orig = history.pushState.bind(history);
		history.pushState =
			/**
			 * Handles the inline callback for the surrounding UI operation.
			 * @param {[data: any, unused: string, url?: string | URL]} args args.
			 */
			(...args) => {
				orig(...args);
				this.onRouteChange();
			};
		this.startTimer();
	}

	/** Cleans up component resources after the element is disconnected. */
	override disconnectedCallback() {
		super.disconnectedCallback();
		ACTIVITY_EVENTS.forEach(
			/**
			 * Handles the inline callback for the surrounding UI operation.
			 * @param {'keydown' | 'mousedown' | 'mousemove' | 'scroll' | 'touchstart'} event DOM event emitted by the UI.
			 */
			event => document.removeEventListener(event, this.boundReset)
		);
		globalThis.removeEventListener('popstate', this.boundRouteChange);
		this.clearAllTimers();
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		if (!this.showWarning) return html``;
		return html`
			<div class="overlay" data-testid="session-timeout-overlay">
				<div class="dialog" data-testid="session-timeout-dialog">
					<h2>Are you still there?</h2>
					<p>You have been inactive and will be automatically logged out.</p>
					<div class="countdown" data-testid="session-timeout-countdown">${this.countdown}</div>
					<p>second${this.countdown === 1 ? '' : 's'} remaining</p>
					<button class="btn-stay" data-testid="session-timeout-stay-btn" @click=${this.stayLoggedIn}>
						Stay Logged In
					</button>
				</div>
			</div>
		`;
	}

	private readonly boundReset = /** Resets inactivity timers from a bound event listener. */ () => this.resetTimer();
	private readonly boundRouteChange = /** Handles route changes from a bound event listener. */ () =>
		this.onRouteChange();

	/** Handles route change. */
	private onRouteChange() {
		if (isExcludedRoute()) {
			this.clearAllTimers();
			this.showWarning = false;
		} else {
			this.startTimer();
		}
	}

	/** Handles clear all timers. */
	private clearAllTimers() {
		if (this.warningTimer !== null) {
			clearTimeout(this.warningTimer);
			this.warningTimer = null;
		}
		if (this.logoutTimer !== null) {
			clearTimeout(this.logoutTimer);
			this.logoutTimer = null;
		}
		if (this.countdownInterval !== null) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}

	/** Handles start timer. */
	private startTimer() {
		if (!localStorage.getItem('token') || isExcludedRoute()) {
			this.clearAllTimers();
			return;
		}

		this.clearAllTimers();
		this.showWarning = false;
		this.countdown = 10;

		this.warningTimer = setTimeout(
			/** Handles the inline callback for the surrounding UI operation. */
			() => {
				if (!localStorage.getItem('token') || isExcludedRoute()) return;
				this.showWarning = true;
				this.countdown = 10;
				this.countdownInterval = setInterval(
					/** Handles the inline callback for the surrounding UI operation. */
					() => {
						this.countdown -= 1;
						if (this.countdown <= 0 && this.countdownInterval !== null) {
							clearInterval(this.countdownInterval);
							this.countdownInterval = null;
						}
					},
					1000
				);
			},
			TIMEOUT_MS - WARNING_MS
		);

		this.logoutTimer = setTimeout(
			/** Handles the inline callback for the surrounding UI operation. */
			() => {
				if (!localStorage.getItem('token') || isExcludedRoute()) return;
				this.doLogout();
			},
			TIMEOUT_MS
		);
	}

	/** Handles reset timer. */
	private resetTimer() {
		if (!localStorage.getItem('token') || isExcludedRoute()) return;
		if (this.showWarning) return;
		this.startTimer();
	}

	/** Handles stay logged in. */
	private stayLoggedIn() {
		this.startTimer();
	}

	/** Handles do logout. */
	private async doLogout() {
		this.clearAllTimers();
		try {
			await this.http.post(`${BASE_API}/auth/logout`);
		} catch {
			/* ignore network errors during logout */
		}
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		globalThis.location.href = '/';
	}
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'session-timeout': SessionTimeout;
	}
}
