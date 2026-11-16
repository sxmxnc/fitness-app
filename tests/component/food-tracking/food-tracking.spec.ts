/**
 * Autor: Simon Josef Cebula

 */
import { fixture, html } from '@open-wc/testing-helpers';
import { expect } from 'chai';
import { LitElement } from 'lit';
import '../../../client/src/components/pages/users/FoodTracking/components/food-summary-card/food-summary-card.js';
import '../../../client/src/components/pages/users/FoodTracking/components/food-entry-form/food-entry-form.js';

const MOCK_SUMMARY = {
	period: 'weekly' as const,
	from: Date.now() - 7 * 86400000,
	to: Date.now(),
	totalCalories: 1850,
	totalProtein: 120,
	totalFat: 65,
	totalCarbs: 210,
	breakdown: [
		{ date: Date.now() - 86400000, calories: 1800, protein: 115, fat: 60, carbs: 200 },
		{ date: Date.now() - 172800000, calories: 1900, protein: 125, fat: 70, carbs: 220 }
	]
};

function q<T extends Element = Element>(el: Element, testId: string): T {
	return el.shadowRoot!.querySelector<T>(`[data-testid="${testId}"]`)!;
}

async function dispatchInput(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
	await new Promise(r => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// FoodSummaryCard
// ---------------------------------------------------------------------------

describe('FoodSummaryCard: Rendering', () => {
	it('rendert alle vier Perioden-Tabs', async () => {
		const el = await fixture(html`<my-food-summary-card></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-summary-tab-daily')).to.exist;
		expect(q(el, 'food-summary-tab-weekly')).to.exist;
		expect(q(el, 'food-summary-tab-monthly')).to.exist;
		expect(q(el, 'food-summary-tab-yearly')).to.exist;
	});

	it('Tab "Heute" ist standardmäßig aktiv', async () => {
		const el = await fixture(html`<my-food-summary-card></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(q<HTMLButtonElement>(el, 'food-summary-tab-daily').classList.contains('active')).to.be.true;
		expect(q<HTMLButtonElement>(el, 'food-summary-tab-weekly').classList.contains('active')).to.be.false;
	});

	it('zeigt 0 kcal wenn kein Summary vorhanden', async () => {
		const el = await fixture(html`<my-food-summary-card></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-summary-calories').textContent?.trim()).to.include('0');
	});

	it('zeigt totalCalories aus Summary-Objekt', async () => {
		const el = await fixture(html`<my-food-summary-card .summary=${MOCK_SUMMARY}></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-summary-calories').textContent).to.include('1850');
	});

	it('zeigt Makros aus Summary-Objekt', async () => {
		const el = await fixture(html`<my-food-summary-card .summary=${MOCK_SUMMARY}></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		const macros = q(el, 'food-summary-macros').textContent ?? '';
		expect(macros).to.include('120');
		expect(macros).to.include('65');
		expect(macros).to.include('210');
	});

	it('zeigt keine Breakdown-Sektion bei period=daily', async () => {
		const el = await fixture(html`<my-food-summary-card .summary=${MOCK_SUMMARY}></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="food-summary-breakdown"]')).to.be.null;
		expect(el.shadowRoot!.querySelector('[data-testid="food-summary-empty"]')).to.be.null;
	});

	it('zeigt Empty-State wenn Breakdown leer ist', async () => {
		const emptySummary = { ...MOCK_SUMMARY, breakdown: [] };
		const el = await fixture(html`<my-food-summary-card period="weekly" .summary=${emptySummary}></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-summary-empty')).to.exist;
	});

	it('zeigt Breakdown-Liste wenn Einträge vorhanden sind', async () => {
		const el = await fixture(html`<my-food-summary-card period="weekly" .summary=${MOCK_SUMMARY}></my-food-summary-card>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-summary-breakdown')).to.exist;
		const rows = el.shadowRoot!.querySelectorAll('.breakdown-row');
		expect(rows.length).to.equal(2);
	});
});

describe('FoodSummaryCard: Events', () => {
	it('feuert period-change Event beim Klicken eines anderen Tabs', async () => {
		const el = await fixture(html`<my-food-summary-card></my-food-summary-card>`);
		await (el as LitElement).updateComplete;

		let receivedPeriod: string | null = null;
		el.addEventListener('period-change', (e: Event) => {
			receivedPeriod = (e as CustomEvent<{ period: string }>).detail.period;
		});

		q<HTMLButtonElement>(el, 'food-summary-tab-weekly').click();
		expect(receivedPeriod).to.equal('weekly');
	});
});

// ---------------------------------------------------------------------------
// FoodEntryForm
// ---------------------------------------------------------------------------

describe('FoodEntryForm: Rendering', () => {
	it('rendert das Eingabeformular', async () => {
		const el = await fixture(html`<my-food-entry-form></my-food-entry-form>`);
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-entry-form')).to.exist;
		expect(q(el, 'food-entry-quantity')).to.exist;
		expect(q(el, 'food-entry-save-btn')).to.exist;
	});
});

describe('FoodEntryForm: Negativ-Validierung Menge', () => {
	it('zeigt input-error Klasse bei negativer Menge', async () => {
		const el = await fixture(html`<my-food-entry-form></my-food-entry-form>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'food-entry-quantity'), '-1');
		await (el as LitElement).updateComplete;
		expect(q<HTMLInputElement>(el, 'food-entry-quantity').classList.contains('input-error')).to.be.true;
	});

	it('zeigt Hinweis "Die Menge darf nicht negativ sein" bei negativer Menge', async () => {
		const el = await fixture(html`<my-food-entry-form></my-food-entry-form>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'food-entry-quantity'), '-5');
		await (el as LitElement).updateComplete;
		expect(q(el, 'food-entry-quantity-hint')).to.exist;
		expect(q(el, 'food-entry-quantity-hint').textContent).to.include('negativ');
	});

	it('deaktiviert Save-Button bei negativer Menge', async () => {
		const el = await fixture(html`<my-food-entry-form></my-food-entry-form>`);
		await (el as LitElement).updateComplete;
		await dispatchInput(q<HTMLInputElement>(el, 'food-entry-quantity'), '-10');
		await (el as LitElement).updateComplete;
		expect(q<HTMLButtonElement>(el, 'food-entry-save-btn').disabled).to.be.true;
	});
});
