/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import vite from './web-test-runner.vite-plugin.js';
import { chromeLauncher } from '@web/test-runner';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const isCI = !!process.env.CI;

export default {
  rootDir: projectRoot,
  files: ['**/*.spec.ts', '!**/node_modules/**', '!tests/e2e/**'],

  browsers: [
    chromeLauncher({
      launchOptions: {
        args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
      }
    })
  ],

  plugins: [vite(projectRoot, ['client/src/**/*.{js,ts}', 'tests/component/**/*.{js,ts}'])],
  coverageConfig: {
    include: ['**/client/src/**/*.{js,ts}'],
    exclude: ['**/node_modules/**', '**/*.spec.ts']
  }
};
