/**
 * Autor: Justus Heinz

 */
import { fixture, html } from '@open-wc/testing-helpers';
import { expect } from 'chai';
import sinon from 'sinon';
import '../../../client/src/components/pages/users/WorkoutSession/workout-session.js';
import { workoutStore } from '../../../client/src/components/pages/users/WorkoutSession/workout-store.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function q<T extends Element = Element>(el: Element, testId: string): T {
	return el.shadowRoot!.querySelector<T>(`[data-testid="${testId}"]`)!;
}

const MOCK_EXERCISES = [
	{
		exerciseId: 'e1',
		name: 'Bench Press',
		exerciseOrder: 1,
		sessionExerciseId: 'se1',
		sets: [
			{ reps: 10, weight: 60 },
			{ reps: 10, weight: 60 },
			{ reps: 8, weight: 60 }
		]
	}
];

function seedStore() {
	workoutStore.isActive = true;
	workoutStore.planId = '';
	workoutStore.sessionId = 'sess1';
	workoutStore.planName = 'Push Day';
	workoutStore.loading = false;
	workoutStore.elapsedSeconds = 90;
	workoutStore.exercises = structuredClone(MOCK_EXERCISES);
	workoutStore.notify();
}

async function createSession(fetchStub: sinon.SinonStub): Promise<Element> {
	localStorage.setItem('token', 'test-token');
	localStorage.setItem('userId', '42');
	fetchStub.callsFake(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
	seedStore();
	const el = await fixture(html`<app-workout-session></app-workout-session>`);
	await new Promise(r => setTimeout(r, 30));
	await (el as any).updateComplete;
	return el;
}

// ── WorkoutSession: Rendering ──────────────────────────────────────────────

describe('WorkoutSession: Rendering', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		workoutStore.clear();
		workoutStore.stopTimer();
		localStorage.clear();
		sinon.restore();
	});

	it('renders the timer element', async () => {
		const el = await createSession(fetchStub);
		expect(q(el, 'timer')).to.exist;
	});

	it('timer shows formatted elapsed time from store', async () => {
		const el = await createSession(fetchStub);
		expect(q(el, 'timer').textContent?.trim()).to.include('01:30');
	});

	it('renders exercises-list', async () => {
		const el = await createSession(fetchStub);
		expect(q(el, 'exercises-list')).to.exist;
	});

	it('renders one exercise-section per exercise', async () => {
		const el = await createSession(fetchStub);
		const sections = el.shadowRoot!.querySelectorAll('[data-testid="exercise-section"]');
		expect(sections.length).to.equal(1);
	});

	it('renders set-rows for each set in the exercise', async () => {
		const el = await createSession(fetchStub);
		const rows = el.shadowRoot!.querySelectorAll('[data-testid="set-row"]');
		expect(rows.length).to.equal(3);
	});
});

// ── WorkoutSession: Sets ───────────────────────────────────────────────────

describe('WorkoutSession: Sets', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		workoutStore.clear();
		workoutStore.stopTimer();
		localStorage.clear();
		sinon.restore();
	});

	it('add-set-btn adds a new set-row', async () => {
		const el = await createSession(fetchStub);
		const before = el.shadowRoot!.querySelectorAll('[data-testid="set-row"]').length;
		q<HTMLButtonElement>(el, 'add-set-btn').click();
		await new Promise(r => setTimeout(r, 0));
		await (el as any).updateComplete;
		const after = el.shadowRoot!.querySelectorAll('[data-testid="set-row"]').length;
		expect(after).to.equal(before + 1);
	});

	it('remove-set-btn is disabled when exercise has only one set', async () => {
		localStorage.setItem('token', 'test-token');
		localStorage.setItem('userId', '42');
		fetchStub.callsFake(() =>
			Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
		);
		workoutStore.isActive = true;
		workoutStore.planId = '';
		workoutStore.sessionId = 'sess1';
		workoutStore.planName = 'Test Plan';
		workoutStore.loading = false;
		workoutStore.elapsedSeconds = 0;
		workoutStore.exercises = [
			{
				exerciseId: 'e1',
				name: 'Squat',
				exerciseOrder: 1,
				sessionExerciseId: 'se1',
				sets: [{ reps: 10, weight: 80 }]
			}
		];
		workoutStore.notify();
		const el = await fixture(html`<app-workout-session></app-workout-session>`);
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;
		expect(q<HTMLButtonElement>(el, 'remove-set-btn').disabled).to.be.true;
	});
});

// ── WorkoutSession: Finish ─────────────────────────────────────────────────

describe('WorkoutSession: Finish', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		workoutStore.clear();
		workoutStore.stopTimer();
		localStorage.clear();
		sinon.restore();
	});

	it('finish-btn is visible and enabled initially', async () => {
		const el = await createSession(fetchStub);
		const btn = q<HTMLButtonElement>(el, 'finish-btn');
		expect(btn).to.exist;
		expect(btn.disabled).to.be.false;
	});
});
