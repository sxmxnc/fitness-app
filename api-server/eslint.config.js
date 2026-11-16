/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import globals from 'globals';
import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ languageOptions: { globals: { ...globals.node } } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	prettier,
	{
		plugins: { '@stylistic': stylistic },
		rules: {
			'no-var': 'error',
			//      'sort-imports': 'error',
			'@stylistic/quotes': ['error', 'single', { allowTemplateLiterals: true }],
			'@stylistic/member-delimiter-style': 'error',
			'@stylistic/no-multi-spaces': 'error',
			'@stylistic/semi': 'error',
			'@stylistic/space-before-blocks': 'error',
			'@stylistic/space-infix-ops': 'error',
			'@typescript-eslint/member-ordering': 'error',
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'method', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'allow' },
				{ selector: ['parameter'], format: ['camelCase'], leadingUnderscore: 'allow' },
				{ selector: 'typeLike', format: ['PascalCase'] },
				{ selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
				{ selector: ['variableLike', 'method'], format: ['camelCase'] }
			],
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-use-before-define': ['error', { functions: false }],
			'prettier/prettier': ['error', { endOfLine: 'auto' }]
		}
	}
];
