import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skill = join(root, 'skills', 'infographic-studio');
const portableCli = join(skill, 'scripts', 'portable-cli.mjs');
const windshield = join(root, 'examples', 'windshield-frit', 'scene.json');
const node = process.execPath;

const run = (args, opts = {}) =>
  execFileSync(node, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000, ...opts });

describe('portable build artifacts', () => {
  test('portable-cli.mjs exists — run: npm run build:portable', () => {
    assert.ok(existsSync(portableCli), `Missing: ${portableCli}`);
  });

  test('runtime-test.js removed by build script', () => {
    assert.ok(!existsSync(join(skill, 'scripts', 'runtime-test.js')), 'runtime-test.js should have been removed');
  });

  test('fonts copied alongside bundle', () => {
    for (const name of ['SourceSans3-Regular.ttf', 'SourceSans3-Semibold.ttf']) {
      assert.ok(existsSync(join(skill, 'assets', 'fonts', name)), `Missing font: ${name}`);
    }
  });

  test('icon catalog copied alongside bundle', () => {
    assert.ok(existsSync(join(skill, 'assets', 'icons', 'tabler', 'catalog.json')));
    assert.ok(existsSync(join(skill, 'assets', 'icons', 'tabler', 'users.svg')));
  });

  test('schemas copied alongside bundle', () => {
    assert.ok(existsSync(join(skill, 'schema', 'scene.schema.json')));
    assert.ok(existsSync(join(skill, 'schema', 'document.schema.json')));
    assert.ok(existsSync(join(skill, 'schema', 'infographic.schema.json')));
  });

  test('pdfkit AFM data copied alongside bundle', () => {
    assert.ok(existsSync(join(skill, 'scripts', 'data', 'Helvetica.afm')), 'pdfkit needs Helvetica.afm at runtime');
  });

  test('bundle does not embed absolute repo paths', () => {
    const content = readFileSync(portableCli, 'utf8');
    // Normalise separators so the check works on Windows too
    const repoPath = root.replace(/\\/g, '/');
    assert.ok(!content.includes(repoPath), 'bundle must not contain the repo root path');
  });

  test('skills directory contains no node_modules', () => {
    assert.ok(!existsSync(join(skill, 'node_modules')), 'skills must not include node_modules');
  });
});

describe('portable CLI: commands', () => {
  test('--help outputs tool name', () => {
    const out = run([portableCli, '--help']);
    assert.ok(out.includes('Infographic Studio'), '--help must mention the tool');
  });

  test('icons --json returns array', () => {
    const out = run([portableCli, 'icons', '--json']);
    const icons = JSON.parse(out);
    assert.ok(Array.isArray(icons) && icons.length >= 17, 'must return at least 17 bundled icons');
  });

  test('structures --json returns array', () => {
    const out = run([portableCli, 'structures', '--json']);
    const structures = JSON.parse(out);
    assert.ok(Array.isArray(structures) && structures.length > 0, 'must return at least one structure');
  });

  test('check on valid scene outputs PASS', () => {
    const out = run([portableCli, 'check', windshield]);
    assert.ok(out.includes('PASS'), `check must pass on windshield example, got: ${out.slice(0, 200)}`);
  });

  test('assets command outputs valid JSON', () => {
    const out = run([portableCli, 'assets', windshield]);
    const plan = JSON.parse(out);
    assert.ok(Array.isArray(plan), 'assets must return an array');
  });

  test('labels command outputs valid JSON', () => {
    const out = run([portableCli, 'labels', windshield]);
    const labels = JSON.parse(out);
    assert.ok(typeof labels === 'object', 'labels must return an object');
  });

  test('render produces SVG and PDF (no PNG in portable mode)', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'infographic-portable-'));
    try {
      run([portableCli, 'render', windshield, '--out', tmp, '--formats', 'svg,pdf', '--scale', '1', '--strict']);
      assert.ok(existsSync(join(tmp, 'figure.svg')), 'SVG must be produced');
      assert.ok(existsSync(join(tmp, 'figure.pdf')), 'PDF must be produced');
      assert.ok(!existsSync(join(tmp, 'figure.png')), 'PNG must not appear in portable mode');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  test('render with PNG in formats fails with exit code != 0', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'infographic-portable-'));
    try {
      let caught;
      try { run([portableCli, 'render', windshield, '--out', tmp, '--formats', 'png', '--scale', '1']); }
      catch (e) { caught = e; }
      assert.ok(caught, 'must throw when PNG is requested');
      assert.notEqual(caught.status, 0, 'exit code must be non-zero');
      assert.ok((caught.stderr + caught.stdout).includes('@resvg'), 'error must mention @resvg');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  test('render with default formats (includes png) fails clearly', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'infographic-portable-'));
    try {
      let caught;
      try { run([portableCli, 'render', windshield, '--out', tmp, '--scale', '1']); }
      catch (e) { caught = e; }
      assert.ok(caught, 'must throw when default formats include png');
      assert.notEqual(caught.status, 0);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  test('init fails with explicit error (no examples in portable)', () => {
    let caught;
    try { run([portableCli, 'init', 'my-project', '--example', 'windshield']); }
    catch (e) { caught = e; }
    assert.ok(caught, 'init must fail in portable mode');
    assert.notEqual(caught.status, 0, 'exit code must be non-zero');
    assert.ok(
      (caught.stderr + caught.stdout).includes('full runtime'),
      `error must mention "full runtime", got stderr: ${caught.stderr?.slice(0, 200)}`,
    );
  });
});

describe('normal CLI resolution', () => {
  test('full cli/cli.js --help works', () => {
    const out = run([join(root, 'cli', 'cli.js'), '--help']);
    assert.ok(out.includes('Infographic Studio'), 'full CLI help must work');
  });

  test('full runtime renders PNG when @resvg is available', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'infographic-full-'));
    try {
      run([join(root, 'cli', 'cli.js'), 'render', windshield, '--out', tmp, '--formats', 'png', '--scale', '1']);
      assert.ok(existsSync(join(tmp, 'figure.png')), 'full runtime must produce PNG');
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
