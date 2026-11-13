import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const config = JSON.parse(readFileSync('tsconfig.seo-regression.json', 'utf8'));
const include = config.include.filter((path) => !path.endsWith('.d.ts'));
const result = spawnSync(
  process.execPath,
  [
    'node_modules/@angular/cli/bin/ng.js',
    'test',
    '--watch=false',
    '--ts-config',
    'tsconfig.seo-regression.json',
    '--runner-config',
    'vitest.website.config.mts',
    ...include.flatMap((path) => ['--include', path]),
  ],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
