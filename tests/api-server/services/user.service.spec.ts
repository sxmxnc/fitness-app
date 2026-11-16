import { expect } from 'chai';
import { UserService, PasswordPolicyError } from '../../../api-server/src/services/user.service.js';

describe('UserService', () => {
	it('prioritizes password policy details for 8+ character passwords missing required classes', async () => {
		const service = new UserService({
			getByEmail: async () => null
		} as never);

		try {
			await service.register({
				email: 'new-user@example.test',
				firstName: 'Max',
				lastName: 'Mustermann',
				password: 'testTest',
				weight: 80,
				height: 180,
				birthDate: 946684800000,
				dailyCalorieGoal: 2200,
				dailyProteinGoal: 140,
				dailyFatGoal: 70,
				dailyCarbsGoal: 250,
				securityQuestionKey: 'first_pet',
				securityAnswer: 'Bello'
			});
			throw new Error('Expected password policy validation to fail');
		} catch (err) {
			expect(err).to.be.instanceOf(PasswordPolicyError);
			expect((err as PasswordPolicyError).errors[0]).to.equal(
				'Das Passwort erfüllt die Passwortrichtlinie nicht.'
			);
		}
	});

	it('keeps the too-short password detail first for very short passwords', async () => {
		const service = new UserService({
			getByEmail: async () => null
		} as never);

		try {
			await service.register({
				email: 'new-user@example.test',
				firstName: 'Max',
				lastName: 'Mustermann',
				password: 'test',
				weight: 80,
				height: 180,
				birthDate: 946684800000,
				dailyCalorieGoal: 2200,
				dailyProteinGoal: 140,
				dailyFatGoal: 70,
				dailyCarbsGoal: 250,
				securityQuestionKey: 'first_pet',
				securityAnswer: 'Bello'
			});
			throw new Error('Expected password policy validation to fail');
		} catch (err) {
			expect(err).to.be.instanceOf(PasswordPolicyError);
			expect((err as PasswordPolicyError).errors[0]).to.equal('Das Passwort ist zu kurz.');
		}
	});
});
