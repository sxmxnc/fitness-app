/**
 * Autor: Simon Josef Cebula

 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import componentStyle from './pending-confirm.css?inline';

@customElement('my-pending-confirm')
export class PendingConfirmComponent extends LitElement {
	static readonly styles = componentStyle;

	@property({ type: String }) foodName = '';

	render() {
		return html`
			<div class="pending-hint">
				<span>„${this.foodName}" wurde noch nicht hinzugefügt.</span>
				<button
					class="pending-hint-btn"
					@click=${() =>
						this.dispatchEvent(new CustomEvent('confirm-and-save', { bubbles: true, composed: true }))}
					type="button"
				>
					Hinzufügen &amp; speichern
				</button>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'my-pending-confirm': PendingConfirmComponent;
	}
}
