/**
 * Autor: Simon Josef Cebula

 */
import { fixture, html } from '@open-wc/testing-helpers';
import { expect } from 'chai';
import sinon from 'sinon';
import { HttpClient } from '../../../client/src/http-client.js';
import { LitElement } from 'lit';
import '../../../client/src/components/pages/admin/FoodtrackingOverview/components/food-create-modal/FoodCreateModal.js';

function q<T extends Element = Element>(el: Element, testId: string): T {
	return el.shadowRoot!.querySelector<T>(`[data-testid="${testId}"]`)!;
}

async function dispatchInput(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
	await new Promise(r => setTimeout(r, 0));
}

async function createModal(): Promise<Element> {
	const el = await fixture(html`<food-create-modal></food-create-modal>`);
	await (el as LitElement).updateComplete;
	return el;
}

describe('FoodCreateModal: Rendering', () => {
	it('rendert den Create-Overlay', async () => {
		const el = await createModal();
		expect(q(el, 'foodtracking-create-overlay')).to.exist;
	});

	it('rendert alle Eingabefelder', async () => {
		const el = await createModal();
		expect(q(el, 'foodtracking-create-name')).to.exist;
		expect(q(el, 'foodtracking-create-calories')).to.exist;
		expect(q(el, 'foodtracking-create-protein')).to.exist;
		expect(q(el, 'foodtracking-create-fat')).to.exist;
		expect(q(el, 'foodtracking-create-carbs')).to.exist;
	});

	it('Save-Button ist initial aktiviert', async () => {
		const el = await createModal();
		expect(q<HTMLButtonElement>(el, 'foodtracking-create-save-btn').disabled).to.be.false;
	});
});

describe('FoodCreateModal: Negative-Wert-Validierung', () => {
	it('zeigt input-error Klasse bei negativen Kalorien', async () => {
		const el = await createModal();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-calories'), '-1');
		await (el as LitElement).updateComplete;
		expect(q<HTMLInputElement>(el, 'foodtracking-create-calories').classList.contains('input-error')).to.be.true;
	});

	it('zeigt Fehlerhinweis bei negativen Nährwerten', async () => {
		const el = await createModal();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-calories'), '-5');
		await (el as LitElement).updateComplete;
		expect(q(el, 'foodtracking-create-negative')).to.exist;
	});

	it('deaktiviert Save-Button bei negativen Nährwerten', async () => {
		const el = await createModal();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-protein'), '-10');
		await (el as LitElement).updateComplete;
		expect(q<HTMLButtonElement>(el, 'foodtracking-create-save-btn').disabled).to.be.true;
	});

	it('entfernt input-error Klasse wenn negativer Wert korrigiert wird', async () => {
		const el = await createModal();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-calories'), '-5');
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-calories'), '200');
		await (el as LitElement).updateComplete;
		expect(q<HTMLInputElement>(el, 'foodtracking-create-calories').classList.contains('input-error')).to.be.false;
	});
});

describe('FoodCreateModal: Over-Limit-Validierung', () => {
	it('zeigt Over-Limit-Hinweis wenn Eiweiß + Fett + KH > 100', async () => {
		const el = await createModal();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-protein'), '50');
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-fat'), '30');
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-carbs'), '30');
		await (el as LitElement).updateComplete;
		expect(q(el, 'foodtracking-create-over-limit')).to.exist;
	});

	it('deaktiviert Save-Button bei Over-Limit', async () => {
		const el = await createModal();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-protein'), '50');
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-fat'), '30');
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-carbs'), '30');
		await (el as LitElement).updateComplete;
		expect(q<HTMLButtonElement>(el, 'foodtracking-create-save-btn').disabled).to.be.true;
	});
});

describe('FoodCreateModal: Events und Server-Kommunikation', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		sinon.restore();
	});

	it('feuert modal-close Event beim Klicken des X-Buttons', async () => {
		const el = await createModal();
		let fired = false;
		el.addEventListener('modal-close', () => { fired = true; });
		el.shadowRoot!.querySelector<HTMLButtonElement>('.edit-close')!.click();
		expect(fired).to.be.true;
	});

	it('feuert food-created Event bei erfolgreichem Speichern', async () => {
		fetchStub.resolves({
			ok: true,
			json: () => Promise.resolve({ id: '1', name: 'Testfood', caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20 })
		} as Response);

		const el = await createModal();
		(el as unknown as { http: HttpClient }).http = new HttpClient();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-name'), 'Testfood');
		await (el as LitElement).updateComplete;

		let fired = false;
		el.addEventListener('food-created', () => { fired = true; });
		q<HTMLButtonElement>(el, 'foodtracking-create-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as LitElement).updateComplete;

		expect(fired).to.be.true;
	});

	it('zeigt Fehlermeldung bei Server-Fehler', async () => {
		fetchStub.resolves({
			ok: false,
			json: () => Promise.resolve({ detail: 'Interner Serverfehler' })
		} as Response);

		const el = await createModal();
		(el as unknown as { http: HttpClient }).http = new HttpClient();
		await dispatchInput(q<HTMLInputElement>(el, 'foodtracking-create-name'), 'Testfood');
		await (el as LitElement).updateComplete;

		q<HTMLButtonElement>(el, 'foodtracking-create-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as LitElement).updateComplete;

		expect(q(el, 'foodtracking-create-error')).to.exist;
	});
});
