/**
 * Autor: Simon Josef Cebula

 */
import { fixture, html } from '@open-wc/testing-helpers';
import { expect } from 'chai';
import sinon from 'sinon';
import { HttpClient } from '../../../client/src/http-client.js';
import { LitElement } from 'lit';
import '../../../client/src/components/pages/admin/FoodtrackingOverview/components/food-edit-modal/FoodEditModal.js';

const MOCK_FOOD = {
	id: '1',
	name: 'Hähnchenbrust',
	caloriesPer100g: 165,
	proteinPer100g: 31,
	fatPer100g: 4,
	carbsPer100g: 0
};

function q<T extends Element = Element>(el: Element, testId: string): T {
	return el.shadowRoot!.querySelector<T>(`[data-testid="${testId}"]`)!;
}

async function dispatchInput(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
	await new Promise(r => setTimeout(r, 0));
}

describe('FoodEditModal: Rendering', () => {
	it('rendert nichts wenn food null ist', async () => {
		const el = await fixture(html`<food-edit-modal></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="foodtracking-edit-overlay"]')).to.be.null;
	});

	it('rendert die Felder mit den Werten des Foods', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'foodtracking-edit-overlay')).to.exist;
		expect(q<HTMLInputElement>(el, 'foodtracking-edit-name').value).to.equal('Hähnchenbrust');
		expect(q<HTMLInputElement>(el, 'foodtracking-edit-calories').value).to.equal('165');
		expect(q<HTMLInputElement>(el, 'foodtracking-edit-protein').value).to.equal('31');
	});

	it('Save-Button ist initial aktiviert', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		expect(q<HTMLButtonElement>(el, 'foodtracking-edit-save-btn').disabled).to.be.false;
	});
});

describe('FoodEditModal: Negative-Wert-Validierung', () => {
	it('zeigt input-error Klasse bei negativen Kalorien', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-edit-calories'), '-1');
		await (el as LitElement).updateComplete;
		expect(q<HTMLInputElement>(el, 'foodtracking-edit-calories').classList.contains('input-error')).to.be.true;
	});

	it('zeigt Fehlerhinweis bei negativem Nährwert', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-edit-protein'), '-5');
		await (el as LitElement).updateComplete;
		expect(q(el, 'foodtracking-edit-negative')).to.exist;
	});

	it('deaktiviert Save-Button bei negativen Nährwerten', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-edit-fat'), '-3');
		await (el as LitElement).updateComplete;
		expect(q<HTMLButtonElement>(el, 'foodtracking-edit-save-btn').disabled).to.be.true;
	});

	it('entfernt Fehler wenn negativer Wert korrigiert wird', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-edit-calories'), '-1');
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-edit-calories'), '200');
		await (el as LitElement).updateComplete;
		expect(q<HTMLInputElement>(el, 'foodtracking-edit-calories').classList.contains('input-error')).to.be.false;
		expect(el.shadowRoot!.querySelector('[data-testid="foodtracking-edit-negative"]')).to.be.null;
	});
});

describe('FoodEditModal: Events und Server-Kommunikation', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		sinon.restore();
	});

	it('feuert modal-close Event beim Klicken des X-Buttons', async () => {
		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		await (el as LitElement).updateComplete;
		let fired = false;
		el.addEventListener('modal-close', () => { fired = true; });
		el.shadowRoot!.querySelector<HTMLButtonElement>('.edit-close')!.click();
		expect(fired).to.be.true;
	});

	it('feuert food-updated Event bei erfolgreichem Speichern', async () => {
		fetchStub.resolves({
			ok: true,
			json: () => Promise.resolve(MOCK_FOOD)
		} as Response);

		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		(el as unknown as { http: HttpClient }).http = new HttpClient();
		await (el as LitElement).updateComplete;

		let fired = false;
		el.addEventListener('food-updated', () => { fired = true; });
		q<HTMLButtonElement>(el, 'foodtracking-edit-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as LitElement).updateComplete;

		expect(fired).to.be.true;
	});

	it('zeigt Fehlermeldung bei Server-Fehler', async () => {
		fetchStub.resolves({
			ok: false,
			json: () => Promise.resolve({ detail: 'Interner Serverfehler' })
		} as Response);

		const el = await fixture(html`<food-edit-modal .food=${MOCK_FOOD}></food-edit-modal>`);
		(el as unknown as { http: HttpClient }).http = new HttpClient();
		await (el as LitElement).updateComplete;

		q<HTMLButtonElement>(el, 'foodtracking-edit-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as LitElement).updateComplete;

		expect(q(el, 'foodtracking-edit-error')).to.exist;
	});
});
