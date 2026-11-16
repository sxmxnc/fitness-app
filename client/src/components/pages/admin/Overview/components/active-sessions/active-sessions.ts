/**
 * Autor: Luca Lammers

 */

import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './active-sessions.css?inline';

/** Defines bento active sessions. */
@customElement('bento-active-sessions')
export class BentoActiveSessions extends LitElement {
	static readonly styles = [componentStyle];

	@property({ type: Number }) count = 0;

	/** Handles setup num property. */
	private static setupNumProperty() {
		if (document.querySelector('style[data-num-property]')) return;
		const style = document.createElement('style');
		style.dataset.numProperty = '';
		style.textContent = '@property --num { syntax: "<integer>"; initial-value: 0; inherits: false; }';
		document.head.appendChild(style);
	}

	/** Initializes component state after the element is connected. */
	connectedCallback() {
		super.connectedCallback();
		BentoActiveSessions.setupNumProperty();
	}

	/**
	 * Responds to Lit property updates after rendering.
	 * @param {PropertyValues} changed changed.
	 */
	updated(changed: PropertyValues) {
		if (changed.has('count')) {
			requestAnimationFrame(
				/**
				 * Handles the inline callback for the surrounding UI operation.
				 * @returns {number} The calculated number.
				 */
				() =>
					requestAnimationFrame(
						/** Handles the inline callback for the surrounding UI operation. */
						() => {
							const sessionsCountElement = this.shadowRoot?.querySelector(
								'.sessions-count'
							) as HTMLElement;
							sessionsCountElement?.style.setProperty('--num', String(this.count));
						}
					)
			);
		}
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		return html`
			<span class="card-title" data-testid="active-sessions-title">Aktive Sitzungen</span>
			<div class="sessions-body card-body">
				<div class="ring-animation" data-testid="active-sessions-ring">
					<div class="left">
						<div class="circle"><div class="mask"></div></div>
					</div>
					<div class="right">
						<div class="circle"><div class="mask"></div></div>
					</div>
					<div class="inner-circle">
						<span class="sessions-count" data-testid="active-sessions-count"></span>
					</div>
				</div>
			</div>
		`;
	}
}
