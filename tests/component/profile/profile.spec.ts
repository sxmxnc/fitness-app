/**
 * Autor: Luca Lammers

 */
import { fixture, html } from '@open-wc/testing-helpers';
import { expect } from 'chai';
import sinon from 'sinon';
import '../../../client/src/components/pages/users/Profile/profile.js';

const RAW_BIRTH_DATE = Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000;
const EXPECTED_AGE = Math.floor((Date.now() - RAW_BIRTH_DATE) / (365.25 * 24 * 60 * 60 * 1000));

const MOCK_USER_RAW = {
	firstName: 'Max',
	lastName: 'Mustermann',
	email: 'max@example.com',
	weight: 80,
	height: 180,
	birthDate: RAW_BIRTH_DATE,
	dailyCalorieGoal: 2000,
	dailyProteinGoal: 150,
	dailyCarbsGoal: 200,
	dailyFatGoal: 70
};

function makeOkResponse(data: unknown = {}): Partial<Response> {
	return { ok: true, json: () => Promise.resolve(data) };
}

function makeErrResponse(): Partial<Response> {
	return { ok: false, json: () => Promise.resolve({}) };
}

function q<T extends Element = Element>(el: Element, testId: string): T {
	return el.shadowRoot!.querySelector<T>(`[data-testid="${testId}"]`)!;
}

async function dispatchInput(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
	await new Promise(r => setTimeout(r, 0));
}

async function createProfile(fetchStub: sinon.SinonStub): Promise<Element> {
	localStorage.setItem('token', 'test-token');
	localStorage.setItem('userId', '42');

	fetchStub.callsFake((url: string) => {
		if (url.includes('/auth/verify')) return Promise.resolve(makeOkResponse());
		if (url.includes('/users/data/')) return Promise.resolve(makeOkResponse(MOCK_USER_RAW));
		return Promise.resolve(makeOkResponse());
	});

	const el = await fixture(html`<app-profile></app-profile>`);
	await new Promise(r => setTimeout(r, 30));
	await (el as any).updateComplete;
	return el;
}

type LitLike = Element & { updateComplete: Promise<boolean> };

async function getErrorText(el: Element): Promise<string | null> {
	const comp = el.shadowRoot!.querySelector('error-message') as LitLike | null;
	if (!comp) return null;
	await comp.updateComplete;
	return comp.shadowRoot?.querySelector('.alert-text')?.textContent ?? null;
}

async function getSuccessText(el: Element): Promise<string | null> {
	const comp = el.shadowRoot!.querySelector('success-message') as LitLike | null;
	if (!comp) return null;
	await comp.updateComplete;
	return comp.shadowRoot?.querySelector('.alert-text')?.textContent ?? null;
}

describe('Profile: Goals Card', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		sinon.restore();
		localStorage.clear();
	});

	it('rendert die Goals Card mit den Nutzerdaten', async () => {
		const el = await createProfile(fetchStub);
		expect(q(el, 'profile-goals-card')).to.exist;
		expect(q<HTMLInputElement>(el, 'profile-goals-age-input').value).to.equal(String(EXPECTED_AGE));
		expect(q<HTMLInputElement>(el, 'profile-goals-weight-input').value).to.equal('80');
		expect(q<HTMLInputElement>(el, 'profile-goals-height-input').value).to.equal('180');
		expect(q<HTMLInputElement>(el, 'profile-goals-calorie-input').value).to.equal('2000');
		expect(q<HTMLInputElement>(el, 'profile-goals-protein-input').value).to.equal('150');
		expect(q<HTMLInputElement>(el, 'profile-goals-carbs-input').value).to.equal('200');
		expect(q<HTMLInputElement>(el, 'profile-goals-fat-input').value).to.equal('70');
	});

	it('klappt die Card beim ersten Klick auf den Toggle-Button zu', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-toggle-btn').click();
		await (el as any).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="profile-goals-age-input"]')).to.be.null;
	});

	it('öffnet die Card beim zweiten Klick auf den Toggle-Button wieder', async () => {
		const el = await createProfile(fetchStub);
		const toggleBtn = q<HTMLButtonElement>(el, 'profile-goals-toggle-btn');
		toggleBtn.click();
		await (el as any).updateComplete;
		toggleBtn.click();
		await (el as any).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="profile-goals-age-input"]')).to.exist;
	});

	it('alle Inputs sind standardmäßig deaktiviert (kein Edit-Modus)', async () => {
		const el = await createProfile(fetchStub);
		expect(q<HTMLInputElement>(el, 'profile-goals-age-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-goals-weight-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-goals-height-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-goals-calorie-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-goals-protein-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-goals-carbs-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-goals-fat-input').disabled).to.be.true;
	});

	it('aktiviert Inputs und zeigt Save-Button im Edit-Modus', async () => {
		const el = await createProfile(fetchStub);
		expect(el.shadowRoot!.querySelector('[data-testid="profile-goals-save-btn"]')).to.be.null;

		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-goals-age-input').disabled).to.be.false;
		expect(q(el, 'profile-goals-save-btn')).to.exist;
	});

	it('stellt die ursprünglichen Daten beim Abbrechen des Editierens wieder her', async () => {
		const el = await createProfile(fetchStub);
		const editBtn = q<HTMLButtonElement>(el, 'profile-goals-edit-btn');
		editBtn.click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-age-input'), '99');

		editBtn.click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-goals-age-input').value).to.equal(String(EXPECTED_AGE));
	});

	it('zeigt Fehlermeldung bei ungültigem Alter (< 1)', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-age-input'), '0');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Alter muss zwischen 1 und 120 liegen.');
	});

	it('zeigt Fehlermeldung bei ungültigem Alter (> 120)', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-age-input'), '121');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Alter muss zwischen 1 und 120 liegen.');
	});

	it('zeigt Fehlermeldung bei Gewicht <= 0', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-weight-input'), '0');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Gewicht muss größer als 0 sein.');
	});

	it('zeigt Fehlermeldung bei Größe <= 0', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-height-input'), '0');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Die Größe muss größer als 0 sein.');
	});

	it('zeigt Fehlermeldung bei negativem Kalorienziel', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-calorie-input'), '-1');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Kalorienziel darf nicht negativ sein.');
	});

	it('zeigt Fehlermeldung bei negativem Protein-Ziel', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-protein-input'), '-5');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Proteinziel darf nicht negativ sein.');
	});

	it('zeigt Fehlermeldung bei negativem Kohlenhydrate-Ziel', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-carbs-input'), '-1');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Kohlenhydratziel darf nicht negativ sein.');
	});

	it('zeigt Fehlermeldung bei negativem Fett-Ziel', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-goals-fat-input'), '-1');

		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Das Fettziel darf nicht negativ sein.');
	});

	it('zeigt Erfolgsmeldung nach erfolgreichem Speichern', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (url.includes('/stats')) return Promise.resolve(makeOkResponse());
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getSuccessText(el)).to.include('Erfolgreich gespeichert.');
	});

	it('verlässt den Edit-Modus nach erfolgreichem Speichern', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake(() => Promise.resolve(makeOkResponse()));

		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(el.shadowRoot!.querySelector('[data-testid="profile-goals-save-btn"]')).to.be.null;
	});

	it('zeigt Fehlermeldung wenn der Server einen Fehler zurückgibt', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (url.includes('/stats')) return Promise.resolve(makeErrResponse());
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Änderungen konnten nicht gespeichert werden.');
	});

	it('zeigt Fehlermeldung bei Netzwerkfehler', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (url.includes('/stats')) return Promise.reject(new Error('Network error'));
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-goals-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-goals-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Server nicht erreichbar.');
	});
});

describe('Profile: Info Card', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		sinon.restore();
		localStorage.clear();
	});

	it('rendert die Info Card mit den Nutzerdaten', async () => {
		const el = await createProfile(fetchStub);
		expect(q(el, 'profile-info-card')).to.exist;
		expect(q<HTMLInputElement>(el, 'profile-info-firstname-input').value).to.equal('Max');
		expect(q<HTMLInputElement>(el, 'profile-info-lastname-input').value).to.equal('Mustermann');
		expect(q<HTMLInputElement>(el, 'profile-info-email-input').value).to.equal('max@example.com');
	});

	it('klappt die Card beim ersten Klick auf den Toggle-Button zu', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-info-toggle-btn').click();
		await (el as any).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="profile-info-firstname-input"]')).to.be.null;
	});

	it('öffnet die Card beim zweiten Klick auf den Toggle-Button wieder', async () => {
		const el = await createProfile(fetchStub);
		const toggleBtn = q<HTMLButtonElement>(el, 'profile-info-toggle-btn');
		toggleBtn.click();
		await (el as any).updateComplete;
		toggleBtn.click();
		await (el as any).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="profile-info-firstname-input"]')).to.exist;
	});

	it('alle Inputs sind standardmäßig deaktiviert (kein Edit-Modus)', async () => {
		const el = await createProfile(fetchStub);
		expect(q<HTMLInputElement>(el, 'profile-info-firstname-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-info-lastname-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-info-email-input').disabled).to.be.true;
	});

	it('aktiviert Inputs und zeigt Save-Button im Edit-Modus', async () => {
		const el = await createProfile(fetchStub);
		expect(el.shadowRoot!.querySelector('[data-testid="profile-info-save-btn"]')).to.be.null;

		q<HTMLButtonElement>(el, 'profile-info-edit-btn').click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-info-firstname-input').disabled).to.be.false;
		expect(q<HTMLInputElement>(el, 'profile-info-lastname-input').disabled).to.be.false;
		expect(q<HTMLInputElement>(el, 'profile-info-email-input').disabled).to.be.false;
		expect(q(el, 'profile-info-save-btn')).to.exist;
	});

	it('stellt den Vornamen beim Abbrechen des Editierens wieder her', async () => {
		const el = await createProfile(fetchStub);
		const editBtn = q<HTMLButtonElement>(el, 'profile-info-edit-btn');
		editBtn.click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-info-firstname-input'), 'Geändert');

		editBtn.click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-info-firstname-input').value).to.equal('Max');
	});

	it('stellt E-Mail beim Abbrechen des Editierens wieder her', async () => {
		const el = await createProfile(fetchStub);
		const editBtn = q<HTMLButtonElement>(el, 'profile-info-edit-btn');
		editBtn.click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-info-email-input'), 'changed@example.com');

		editBtn.click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-info-email-input').value).to.equal('max@example.com');
	});

	it('zeigt Erfolgsmeldung nach erfolgreichem Speichern', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (/\/users\/\d+$/.test(url)) return Promise.resolve(makeOkResponse());
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-info-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-info-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getSuccessText(el)).to.include('Erfolgreich gespeichert.');
	});

	it('verlässt den Edit-Modus nach erfolgreichem Speichern', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake(() => Promise.resolve(makeOkResponse()));

		q<HTMLButtonElement>(el, 'profile-info-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-info-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(el.shadowRoot!.querySelector('[data-testid="profile-info-save-btn"]')).to.be.null;
	});

	it('zeigt Fehlermeldung wenn der Server einen Fehler zurückgibt', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (/\/users\/\d+$/.test(url)) return Promise.resolve(makeErrResponse());
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-info-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-info-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Änderungen konnten nicht gespeichert werden.');
	});

	it('zeigt Fehlermeldung bei Netzwerkfehler', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (/\/users\/\d+$/.test(url)) return Promise.reject(new Error('Network error'));
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-info-edit-btn').click();
		await (el as any).updateComplete;
		q<HTMLButtonElement>(el, 'profile-info-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Server nicht erreichbar.');
	});
});

describe('Profile: Password Card', () => {
	let fetchStub: sinon.SinonStub;

	beforeEach(() => {
		fetchStub = sinon.stub(window, 'fetch');
	});

	afterEach(() => {
		sinon.restore();
		localStorage.clear();
	});

	it('rendert die Password Card', async () => {
		const el = await createProfile(fetchStub);
		expect(q(el, 'profile-password-card')).to.exist;
		expect(q<HTMLInputElement>(el, 'profile-password-current-input')).to.exist;
		expect(q<HTMLInputElement>(el, 'profile-password-new-input')).to.exist;
		expect(q<HTMLInputElement>(el, 'profile-password-confirm-input')).to.exist;
	});

	it('klappt die Card beim ersten Klick auf den Toggle-Button zu', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-toggle-btn').click();
		await (el as any).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="profile-password-current-input"]')).to.be.null;
	});

	it('öffnet die Card beim zweiten Klick auf den Toggle-Button wieder', async () => {
		const el = await createProfile(fetchStub);
		const toggleBtn = q<HTMLButtonElement>(el, 'profile-password-toggle-btn');
		toggleBtn.click();
		await (el as any).updateComplete;
		toggleBtn.click();
		await (el as any).updateComplete;
		expect(el.shadowRoot!.querySelector('[data-testid="profile-password-current-input"]')).to.exist;
	});

	it('alle Inputs sind standardmäßig deaktiviert (kein Edit-Modus)', async () => {
		const el = await createProfile(fetchStub);
		expect(q<HTMLInputElement>(el, 'profile-password-current-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-password-new-input').disabled).to.be.true;
		expect(q<HTMLInputElement>(el, 'profile-password-confirm-input').disabled).to.be.true;
		expect(el.shadowRoot!.querySelector('password-strength-meter')).to.be.null;
	});

	it('aktiviert Inputs und zeigt Passwort-Meter sowie Save-Button im Edit-Modus', async () => {
		const el = await createProfile(fetchStub);
		expect(el.shadowRoot!.querySelector('[data-testid="profile-password-save-btn"]')).to.be.null;

		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-password-current-input').disabled).to.be.false;
		expect(q<HTMLInputElement>(el, 'profile-password-new-input').disabled).to.be.false;
		expect(q<HTMLInputElement>(el, 'profile-password-confirm-input').disabled).to.be.false;
		expect(el.shadowRoot!.querySelector('password-strength-meter')).to.exist;
		expect(q(el, 'profile-password-save-btn')).to.exist;
	});

	it('leert alle Felder beim Abbrechen des Editierens', async () => {
		const el = await createProfile(fetchStub);
		const editBtn = q<HTMLButtonElement>(el, 'profile-password-edit-btn');
		editBtn.click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'NewPass12!');

		editBtn.click();
		await (el as any).updateComplete;

		expect(q<HTMLInputElement>(el, 'profile-password-current-input').value).to.equal('');
		expect(q<HTMLInputElement>(el, 'profile-password-new-input').value).to.equal('');
		expect(q<HTMLInputElement>(el, 'profile-password-confirm-input').value).to.equal('');
	});

	it('zeigt Fehlermeldung wenn Felder leer sind', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Bitte alle Felder ausfüllen.');
	});

	it('zeigt Fehlermeldung wenn neues Passwort und Bestätigung nicht übereinstimmen', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'NewPass12!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'Different1!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Die neuen Passwörter stimmen nicht überein.');
	});

	it('zeigt Fehlermeldung wenn neues Passwort zu kurz ist (< 12 Zeichen)', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'Ab1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'Ab1!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Mind. 12 Zeichen');
	});

	it('zeigt Fehlermeldung wenn neues Passwort kein Großbuchstaben hat', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'nouppercase12!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'nouppercase12!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Mind. 12 Zeichen');
	});

	it('zeigt Fehlermeldung wenn neues Passwort keine Ziffer hat', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'WithoutDigit!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'WithoutDigit!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Mind. 12 Zeichen');
	});

	it('zeigt Fehlermeldung wenn neues Passwort kein Sonderzeichen hat', async () => {
		const el = await createProfile(fetchStub);
		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'NoSpecial12A');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'NoSpecial12A');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Mind. 12 Zeichen');
	});

	it('zeigt Erfolgsmeldung und leert Felder nach erfolgreichem Passwort-Wechsel', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (url.includes('/password')) return Promise.resolve(makeOkResponse());
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'NewSecurePass12!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'NewSecurePass12!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getSuccessText(el)).to.include('Passwort erfolgreich geändert.');
		expect(q<HTMLInputElement>(el, 'profile-password-current-input').value).to.equal('');
		expect(q<HTMLInputElement>(el, 'profile-password-new-input').value).to.equal('');
		expect(q<HTMLInputElement>(el, 'profile-password-confirm-input').value).to.equal('');
	});

	it('zeigt Fehlermeldung wenn der Server einen Fehler zurückgibt', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (url.includes('/password')) return Promise.resolve(makeErrResponse());
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'NewSecurePass12!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'NewSecurePass12!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Passwort konnte nicht geändert werden.');
	});

	it('zeigt Fehlermeldung bei Netzwerkfehler', async () => {
		const el = await createProfile(fetchStub);
		fetchStub.callsFake((url: string) => {
			if (url.includes('/password')) return Promise.reject(new Error('Network error'));
			return Promise.resolve(makeOkResponse());
		});

		q<HTMLButtonElement>(el, 'profile-password-edit-btn').click();
		await (el as any).updateComplete;

		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-current-input'), 'OldPass1!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-new-input'), 'NewSecurePass12!');
		await dispatchInput(q<HTMLInputElement>(el, 'profile-password-confirm-input'), 'NewSecurePass12!');

		q<HTMLButtonElement>(el, 'profile-password-save-btn').click();
		await new Promise(r => setTimeout(r, 30));
		await (el as any).updateComplete;

		expect(await getErrorText(el)).to.include('Server nicht erreichbar.');
	});
});
