/**
 * Autor: Justus Heinz

 */
import { expect } from 'chai';
import sinon from 'sinon';
import { ContextProvider } from '@lit/context';
import { HttpClient, httpClientContext } from '../../../client/src/http-client.js';
import '../../../client/src/components/pages/users/Workout/workout-list.js';

// ── Helpers ────────────────────────────────────────────────────────────────

let testContainer: HTMLDivElement | null = null;

function makeOkResponse(data: unknown = {}): Partial<Response> {
	return { ok: true, json: () => Promise.resolve(data) };
}

function deepShadowQuery<T extends Element = Element>(root: Element, selector: string): T | null {
	const sr = root.shadowRoot;
	if (!sr) return null;
	const direct = sr.querySelector<T>(selector);
	if (direct) return direct;
	for (const child of Array.from(sr.querySelectorAll<Element>('*'))) {
		if (child.shadowRoot) {
			const found = deepShadowQuery<T>(child, selector);
			if (found) return found;
		}
	}
	return null;
}

function deepShadowQueryAll<T extends Element = Element>(root: Element, selector: string): T[] {
	const results: T[] = [];
	const sr = root.shadowRoot;
	if (!sr) return results;
	results.push(...Array.from(sr.querySelectorAll<T>(selector)));
	for (const child of Array.from(sr.querySelectorAll<Element>('*'))) {
		if (child.shadowRoot) {
			results.push(...deepShadowQueryAll<T>(child, selector));
		}
	}
	return results;
}

function q<T extends Element = Element>(el: Element, testId: string): T {
	return deepShadowQuery<T>(el, `[data-testid="${testId}"]`)!;
}

async function dispatchInput(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
	await new Promise(r => setTimeout(r, 0));
}

const MOCK_PLANS = [
	{ id: 'p1', name: 'Push Day', description: null, isSystemProperty: false },
	{ id: 'p2', name: 'Pull Day', description: null, isSystemProperty: false }
];

async function createWorkoutList(
	fetchStub: sinon.SinonStub,
	plans: unknown[] = MOCK_PLANS
): Promise<Element> {
	localStorage.setItem('token', 'test-token');
	localStorage.setItem('userId', '42');
	fetchStub.callsFake((url: string) => {
		if (url.includes('/workout-plans/order')) return Promise.resolve(makeOkResponse([]));
		if (url.includes('/workout-plans/') && url.includes('/exercises'))
			return Promise.resolve(makeOkResponse([]));
		if (url.includes('/workout-plans')) return Promise.resolve(makeOkResponse(plans));
		if (url.includes('/exercises')) return Promise.resolve(makeOkResponse([]));
		return Promise.resolve(makeOkResponse());
	});
	testContainer = document.createElement('div');
	document.body.appendChild(testContainer);
	new ContextProvider(testContainer, { context: httpClientContext, initialValue: new HttpClient() });
	const el = document.createElement('app-workout-list');
	testContainer.appendChild(el);
	await new Promise(r => setTimeout(r, 50));
	await (el as any).updateComplete;
	return el;
}

async function openModal(el: Element): Promise<void> {
	q<HTMLButtonElement>(el, 'new-plan-btn').click();
	await new Promise(r => setTimeout(r, 0));
	await (el as any).updateComplete;
}

// ── WorkoutList: Rendering ─────────────────────────────────────────────────

describe('WorkoutList: Rendering', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		testContainer?.remove();
		testContainer = null;
		localStorage.clear();
		sinon.restore();
	});

	it('shows plan-list container when plans are loaded', async () => {
		const el = await createWorkoutList(fetchStub);
		expect(q(el, 'plan-list')).to.exist;
	});

	it('renders one plan-card per plan', async () => {
		const el = await createWorkoutList(fetchStub);
		const cards = el.shadowRoot!.querySelectorAll('[data-testid="plan-card"]');
		expect(cards.length).to.equal(2);
	});

	it('shows empty-state when no plans exist', async () => {
		const el = await createWorkoutList(fetchStub, []);
		expect(q(el, 'empty-state')).to.exist;
	});

	it('plan-card shows the plan name', async () => {
		const el = await createWorkoutList(fetchStub);
		const card = q(el, 'plan-card');
		const planName = card.shadowRoot?.querySelector('.plan-name')?.textContent ?? '';
		expect(planName).to.include('Push Day');
	});

	it('new-plan-btn is visible', async () => {
		const el = await createWorkoutList(fetchStub);
		expect(q(el, 'new-plan-btn')).to.exist;
	});
});

// ── WorkoutList: Modal ─────────────────────────────────────────────────────

describe('WorkoutList: Modal', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		testContainer?.remove();
		testContainer = null;
		localStorage.clear();
		sinon.restore();
	});

	it('clicking new-plan-btn opens create-plan-modal', async () => {
		const el = await createWorkoutList(fetchStub);
		await openModal(el);
		expect(q(el, 'create-plan-modal')).to.exist;
	});

	it('modal contains plan-name-input', async () => {
		const el = await createWorkoutList(fetchStub);
		await openModal(el);
		expect(q(el, 'plan-name-input')).to.exist;
	});

	it('add-exercise-btn adds an exercise-row', async () => {
		const el = await createWorkoutList(fetchStub);
		await openModal(el);
		const before = deepShadowQueryAll(el, '[data-testid="exercise-row"]').length;
		q<HTMLButtonElement>(el, 'add-exercise-btn').click();
		await new Promise(r => setTimeout(r, 0));
		await (el as any).updateComplete;
		const after = deepShadowQueryAll(el, '[data-testid="exercise-row"]').length;
		expect(after).to.equal(before + 1);
	});

	it('remove-exercise-btn removes an exercise-row', async () => {
		const el = await createWorkoutList(fetchStub);
		await openModal(el);
		q<HTMLButtonElement>(el, 'add-exercise-btn').click();
		await new Promise(r => setTimeout(r, 0));
		await (el as any).updateComplete;
		const before = deepShadowQueryAll(el, '[data-testid="exercise-row"]').length;
		q<HTMLButtonElement>(el, 'remove-exercise-btn').click();
		await new Promise(r => setTimeout(r, 0));
		await (el as any).updateComplete;
		const after = deepShadowQueryAll(el, '[data-testid="exercise-row"]').length;
		expect(after).to.equal(before - 1);
	});
});

// ── WorkoutList: Save ──────────────────────────────────────────────────────

describe('WorkoutList: Save', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		testContainer?.remove();
		testContainer = null;
		localStorage.clear();
		sinon.restore();
	});

	it('saving without plan name shows validation error', async () => {
		const el = await createWorkoutList(fetchStub);
		await openModal(el);
		q<HTMLButtonElement>(el, 'save-plan-btn').click();
		await new Promise(r => setTimeout(r, 0));
		await (el as any).updateComplete;
		expect(deepShadowQuery(el, '.field-error')).to.exist;
	});

	it('successful save calls POST /workout-plans and shows success toast', async () => {
		const el = await createWorkoutList(fetchStub);
		fetchStub.callsFake((url: string, opts?: RequestInit) => {
			if (url.includes('/exercises') && opts?.method === 'POST')
				return Promise.resolve(makeOkResponse({ id: 'ex1' }));
			if (url.includes('/workout-plans/') && url.includes('/exercises') && opts?.method === 'POST')
				return Promise.resolve(makeOkResponse({ id: 'pe1' }));
			if (url.includes('/workout-plans') && opts?.method === 'POST')
				return Promise.resolve(makeOkResponse({ id: 'new-plan' }));
			if (url.includes('/workout-plans/order')) return Promise.resolve(makeOkResponse([]));
			if (url.includes('/workout-plans/') && url.includes('/exercises'))
				return Promise.resolve(makeOkResponse([]));
			if (url.includes('/workout-plans')) return Promise.resolve(makeOkResponse([]));
			if (url.includes('/exercises')) return Promise.resolve(makeOkResponse([]));
			return Promise.resolve(makeOkResponse());
		});
		await openModal(el);
		await dispatchInput(q<HTMLInputElement>(el, 'plan-name-input'), 'Mein Plan');
		const nameInputs = deepShadowQueryAll<HTMLInputElement>(el, '[data-testid="exercise-name-input"]');
		if (nameInputs.length > 0) await dispatchInput(nameInputs[0], 'Squat');
		q<HTMLButtonElement>(el, 'save-plan-btn').click();
		await new Promise(r => setTimeout(r, 100));
		await (el as any).updateComplete;
		const postCall = fetchStub
			.getCalls()
			.find(
				c => c.args[0].includes('/workout-plans') && (c.args[1] as RequestInit)?.method === 'POST'
			);
		expect(postCall).to.exist;
		const toast = el.shadowRoot!.querySelector('success-message');
		expect(toast).to.exist;
		await (toast as any).updateComplete;
		expect(toast!.shadowRoot!.querySelector('.alert')).to.exist;
	});
});

// ── WorkoutList: Delete ────────────────────────────────────────────────────

describe('WorkoutList: Delete', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		testContainer?.remove();
		testContainer = null;
		localStorage.clear();
		sinon.restore();
	});

	it('delete-plan-btn calls DELETE /workout-plans/{id}', async () => {
		const singlePlan = [{ id: 'p1', name: 'Push Day', description: null, isSystemProperty: false }];
		const el = await createWorkoutList(fetchStub, singlePlan);
		fetchStub.callsFake((url: string, opts?: RequestInit) => {
			if (opts?.method === 'DELETE') return Promise.resolve(makeOkResponse());
			if (url.includes('/workout-plans/order')) return Promise.resolve(makeOkResponse([]));
			if (url.includes('/workout-plans/') && url.includes('/exercises'))
				return Promise.resolve(makeOkResponse([]));
			if (url.includes('/workout-plans')) return Promise.resolve(makeOkResponse([]));
			return Promise.resolve(makeOkResponse());
		});
		q<HTMLButtonElement>(el, 'delete-plan-btn').click();
		await new Promise(r => setTimeout(r, 50));
		const deleteCall = fetchStub
			.getCalls()
			.find(c => (c.args[1] as RequestInit)?.method === 'DELETE');
		expect(deleteCall).to.exist;
		expect(deleteCall!.args[0]).to.include('/workout-plans/p1');
	});
});
