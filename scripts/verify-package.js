import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exercise a real installed tarball, outside the source tree and its node_modules.
const root = fileURLToPath(new URL('../', import.meta.url));
const npmPath = process.env.npm_execpath;
if (!npmPath) throw new Error('Run this check with npm run verify:package.');
const temporaryRoot = resolve(tmpdir());
const temporary = await mkdtemp(join(temporaryRoot, 'infographic-package-'));
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const npm = (args, cwd) => execFileSync(process.execPath, [npmPath, ...args], {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180_000,
});

try {
  const pkg = await json(join(root, 'package.json'));
  const lock = await json(join(root, 'package-lock.json'));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  for (const folder of ['.codex-plugin', '.claude-plugin']) {
    const manifest = await json(join(root, folder, 'plugin.json'));
    assert.equal(manifest.version, pkg.version, `${folder} version must match the package`);
  }

  const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', temporary], root));
  const files = new Set(packed.files.map(({ path }) => path));
  for (const required of ['LICENSE', 'CHANGELOG.md', 'cli/cli.js', 'src/index.js',
    'schema/document.schema.json', 'assets/fonts/LICENSE.md', 'assets/icons/tabler/LICENSE',
    'skills/infographic-studio/SKILL.md', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json']) {
    assert.ok(files.has(required), `Missing packed file: ${required}`);
  }
  assert.ok(![...files].some((path) => /(^|\/)(node_modules|\.git|\.env)(\/|$)/.test(path)));

  const consumer = join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(join(consumer, 'package.json'), '{"private":true,"type":"module"}\n');
  npm(['install', '--omit=dev', '--no-audit', '--no-fund', join(temporary, packed.filename)], consumer);
  const installed = join(consumer, 'node_modules', ...pkg.name.split('/'));
  assert.equal((await json(join(installed, 'package.json'))).version, pkg.version);
  assert.match(npm(['exec', '--offline', '--', 'infographic-studio', '--help'], consumer), /Infographic Studio/);
  const cli = (...args) => execFileSync(process.execPath, [join(installed, 'cli/cli.js'), ...args], {
    cwd: consumer, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000,
  });
  assert.ok(JSON.parse(cli('icons', '--json')).length >= 17);
  for (const example of ['windshield', 'kubernetes', 'jwst', 'heat-pump', 'crispr', 'ligo', 'kafka']) {
    cli('init', example, '--example', example);
    cli('check', `${example}/scene.json`, '--strict');
  }
  cli('render', 'windshield/scene.json', '--out', 'windshield-output', '--scale', '1', '--strict');
  for (const format of ['svg', 'png', 'pdf']) {
    assert.ok((await stat(join(consumer, 'windshield-output', `figure.${format}`))).size > 100);
  }
  await writeFile(join(consumer, 'compose-input.json'), JSON.stringify({ scene: await json(join(consumer, 'kubernetes/scene.json')), placements: [] }));
  cli('compose', 'compose-input.json', '--out', 'kubernetes-scene.json');
  cli('check', 'kubernetes-scene.json', '--strict', '--print-width', '320', '--min-font', '8');
  console.log(`Package ${pkg.version}: isolated install, CLI, seven illustrated starters, windshield SVG/PNG/PDF and editable composition passed.`);
  console.log(`Packed ${packed.files.length} files (${(packed.size / 1048576).toFixed(1)} MiB compressed). Nothing published.`);
} finally {
  // Remove only the unique directory allocated by this check, never a caller-supplied path.
  assert.equal(dirname(resolve(temporary)), temporaryRoot);
  assert.ok(resolve(temporary).startsWith(join(temporaryRoot, 'infographic-package-')));
  await rm(temporary, { recursive: true, force: true });
}
