/**
 * Autor: Luca Lammers

 */
import { expect } from 'chai';
import { z } from 'zod';
import { canonicalizeText, dateOnlySchema, uuidV4Schema, validationDetail } from '../../../api-server/src/utils/validation.util.js';

describe('validation.util', () => {
	it('canonicalizes URL-encoded and unicode-normalized text before validation', () => {
		expect(canonicalizeText('..%2Fconfig')).to.equal('../config');
		expect(canonicalizeText('e\u0301')).to.equal('é');
	});

	it('accepts valid UUID v4 values after canonicalization', () => {
		const result = uuidV4Schema.safeParse('  8cba5383-3ede-4ad3-93cb-f7b36ccbc216  ');

		expect(result.success).to.equal(true);
	});

	it('rejects non-scalar and malformed UUID values', () => {
		expect(uuidV4Schema.safeParse(['8cba5383-3ede-4ad3-93cb-f7b36ccbc216']).success).to.equal(false);
		expect(uuidV4Schema.safeParse('..%2F..%2Fconfig.json').success).to.equal(false);
	});

	it('rejects invalid calendar dates', () => {
		expect(dateOnlySchema.safeParse('2026-02-28').success).to.equal(true);
		expect(dateOnlySchema.safeParse('2026-02-31').success).to.equal(false);
	});

	it('formats validation errors without leaking internals', () => {
		const schema = z.object({ userId: uuidV4Schema });
		const result = schema.safeParse({ userId: 'bad-id' });

		expect(result.success).to.equal(false);
		if (!result.success) {
			expect(validationDetail(result.error)).to.equal('userId: must be a valid UUID v4');
		}
	});
});
