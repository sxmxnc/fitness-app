/**
 * Autor: Luca Lammers

 */
import { expect } from 'chai';
import {
	encodeUrlParameter,
	escapeCssValue,
	escapeHtml,
	escapeHtmlAttribute,
	escapeJavaScriptString,
	quoteSqlIdentifier,
	validateHttpUrl
} from '../../../api-server/src/utils/output-encoding.util.js';

describe('output-encoding.util', () => {
	it('escapes dangerous HTML element content characters', () => {
		expect(escapeHtml(`<img src=x onerror="alert('xss')">/`)).to.equal(
			'&lt;img src=x onerror=&quot;alert(&#x27;xss&#x27;)&quot;&gt;&#x2F;'
		);
	});

	it('escapes HTML attribute values with hex entities', () => {
		expect(escapeHtmlAttribute(`" onmouseover="alert(1)`)).to.equal(
			'&#x22;&#x20;onmouseover&#x3D;&#x22;alert&#x28;1&#x29;'
		);
	});

	it('escapes JavaScript string-literal values', () => {
		expect(escapeJavaScriptString(`'; alert('XSS'); //`)).to.equal(
			'\\x27\\x3B\\x20alert\\x28\\x27XSS\\x27\\x29\\x3B\\x20\\x2F\\x2F'
		);
	});

	it('escapes CSS property values', () => {
		expect(escapeCssValue(`url(javascript:alert(1))`)).to.equal('url\\28 javascript\\3A alert\\28 1\\29 \\29 ');
	});

	it('encodes URL parameter values', () => {
		expect(encodeUrlParameter('a b&next=javascript:alert(1)')).to.equal('a%20b%26next%3Djavascript%3Aalert%281%29');
	});

	it('rejects dangerous absolute URL schemes', () => {
		expect(validateHttpUrl('https://example.org/path')).to.equal('https://example.org/path');
		expect(() => validateHttpUrl('javascript:alert(1)')).to.throw('URL protocol must be http or https');
	});

	it('quotes only allowlisted SQL identifiers', () => {
		expect(quoteSqlIdentifier('users')).to.equal('"users"');
		expect(() => quoteSqlIdentifier('users; DROP TABLE users; --')).to.throw('Invalid SQL identifier');
	});
});
