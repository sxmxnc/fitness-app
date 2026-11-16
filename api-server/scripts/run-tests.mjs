import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const nodeModules = path.resolve('node_modules');
process.env.NODE_PATH = [nodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
require('node:module').Module._initPaths();

const result = spawnSync(
	process.execPath,
	['--import', 'tsx', 'node_modules/mocha/bin/mocha.js', '../tests/api-server/**/*.spec.ts'],
	{
		stdio: 'inherit',
		env: process.env
	}
);

process.exit(result.status ?? 1);
