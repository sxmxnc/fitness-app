/**
 * Autor: Luca Lammers

 * d.velop inspired
 */
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import componentStyle from './info-message.css?inline';

/** Defines info message. */
@customElement('info-message')
export class InfoMessage extends LitElement {
	static readonly styles = [componentStyle];

	@state() private visible = false;
	@state() private fading = false;
	@state() private message = '';

	private timer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Shows show.
	 * @param {string} message message.
	 */
	show(message: string) {
		if (this.timer !== null) clearTimeout(this.timer);

		if (this.visible) {
			this.fading = true;
			setTimeout(
				/** Handles the inline callback for the surrounding UI operation. */
				() => {
					this.fading = false;
					this.visible = false;
					this.updateComplete.then(
						/** Handles the resolved promise value. */
						() => {
							this.message = message;
							this.visible = true;
							this.timer = setTimeout(
								/** Handles the inline callback for the surrounding UI operation. */
								() => this.hideWithFade(),
								7000
							);
						}
					);
				},
				300
			);
		} else {
			this.message = message;
			this.visible = true;
			this.timer = setTimeout(
				/** Handles the inline callback for the surrounding UI operation. */
				() => this.hideWithFade(),
				7000
			);
		}
	}

	/**
	 * Renders the component template.
	 * @returns {TemplateResult<1>} The Lit template to render.
	 */
	render() {
		if (!this.visible) return html``;
		return html`
			<div class="alert ${this.fading ? 'fading' : ''}">
				<div class="alert-row">
					<span class="alert-text">${this.message}</span>
					<button
						class="alert-close"
						@click=${/** Handles the inline callback for the surrounding UI operation. */ () => this.hide()}
						type="button"
					>
						✕
					</button>
				</div>
				<div class="progress-track">
					<div class="progress-fill"></div>
				</div>
			</div>
		`;
	}

	/** Hides with fade. */
	private hideWithFade() {
		this.fading = true;
		setTimeout(
			/** Handles the inline callback for the surrounding UI operation. */
			() => {
				this.fading = false;
				this.visible = false;
				this.timer = null;
			},
			300
		);
	}

	/** Hides hide. */
	private hide() {
		if (this.timer !== null) clearTimeout(this.timer);
		this.hideWithFade();
	}
}

declare global {
	/** Describes the htmlelement tag name map shape. */
	interface HTMLElementTagNameMap {
		'info-message': InfoMessage;
	}
}
