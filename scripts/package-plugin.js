#!/usr/bin/env node
import AdmZip from 'adm-zip';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const out = join(dist, 'infographic-studio.zip');

// Step 1 — guarantee the portable runtime is current.
console.log('Building portable runtime...');
execFileSync(process.execPath, [join(root, 'scripts', 'build-portable.js')], {
  cwd: root, stdio: 'inherit', timeout: 120_000,
});

// Step 2 — prepare dist/.
await rm(out, { force: true });
await mkdir(dist, { recursive: true });

// Step 3 — collect files and build ZIP.
// Recurse into `dir`, skipping any entry whose name is in `skip`.
function* walk(dir, skip = new Set(['node_modules', '.git'])) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full, skip);
    else yield full;
  }
}

const zip = new AdmZip();

// Directories included at their own name in the zip root.
const includeDirs = ['.claude-plugin', '.codex-plugin', 'skills', 'cli', 'src', 'schema', 'assets', 'examples'];
for (const name of includeDirs) {
  const base = join(root, name);
  if (!existsSync(base)) continue;
  for (const file of walk(base)) {
    // ZIP entry paths must use forward slashes on all platforms.
    const entry = (name + '/' + relative(base, file)).replace(/\\/g, '/');
    zip.addFile(entry, readFileSync(file));
  }
}

// Root-level files placed directly at the zip root.
for (const name of ['package.json', 'package-lock.json', 'README.md', 'CHANGELOG.md', 'LICENSE']) {
  const full = join(root, name);
  if (existsSync(full)) zip.addFile(name, readFileSync(full));
}

zip.writeZip(out);

// Step 4 — validate ZIP contents.
const verify = new AdmZip(out);
const entries = verify.getEntries().map(e => e.entryName);
const entrySet = new Set(entries);
const fileCount = entries.filter(e => !e.endsWith('/')).length;
const { size } = statSync(out);

const required = [
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
  'skills/infographic-studio/SKILL.md',
  'skills/infographic-studio/scripts/portable-cli.mjs',
  'cli/cli.js',
  'src/index.js',
  'package.json',
  'package-lock.json',
];

const errors = [];
for (const r of required) {
  if (!entrySet.has(r)) errors.push(`Missing required entry: ${r}`);
}
if (entries.some(e => /(?:^|\/)node_modules\//.test(e))) errors.push('ZIP must not contain node_modules/');
if (entries.some(e => /(?:^|\/)\.git\//.test(e))) errors.push('ZIP must not contain .git/');

// No additional wrapper folder at the zip root.
const topLevel = new Set(entries.map(e => e.split('/')[0]).filter(Boolean));
for (const banned of ['infographic-studio', 'dist']) {
  if (topLevel.has(banned)) errors.push(`Unexpected root folder in ZIP: ${banned}/`);
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL: ${e}`);
  process.exitCode = 1;
} else {
  console.log(`\nZIP:        ${out}`);
  console.log(`Size:       ${(size / 1048576).toFixed(2)} MiB`);
  console.log(`Files:      ${fileCount}`);
  console.log('Validation: PASS');
}
