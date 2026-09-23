#!/usr/bin/env node
/**
 * Builds the portable Infographic Studio runtime for Claude.ai.
 *
 * Bundles cli/cli.js (and all of src/) into a single ESM file at
 * skills/infographic-studio/scripts/portable-cli.mjs, then copies the
 * fonts, icons and schema alongside it.
 *
 * At runtime, every new URL('../...', import.meta.url) in the bundled code
 * resolves relative to portable-cli.mjs (skills/infographic-studio/scripts/),
 * so ../assets/ and ../schema/ point to the copies made here.
 *
 * @resvg/resvg-js is kept external; the dynamic import in src/index.js
 * catches the missing module and degrades: SVG + PDF work, PNG is skipped.
 *
 * Run: node scripts/build-portable.js
 */
import { build } from 'esbuild';
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skill = join(root, 'skills', 'infographic-studio');
const scripts = join(skill, 'scripts');

// Remove stale artifacts before rebuilding.
await rm(join(scripts, 'portable-cli.mjs'), { force: true });
await rm(join(scripts, 'runtime-test.js'), { force: true });
await rm(join(scripts, 'data'), { recursive: true, force: true });
await rm(join(skill, 'assets'), { recursive: true, force: true });
await rm(join(skill, 'schema'), { recursive: true, force: true });

// Bundle cli/cli.js + all of src/ into one ESM file.
// @resvg/resvg-js is replaced by a null stub (via plugin) so the canonical
// static import in src/index.js compiles fine and Resvg=null makes renderPng throw.
// pdfkit is CJS; the banner injects require + __dirname so its Node built-in
// requires resolve correctly inside the ESM bundle.
await build({
  entryPoints: [join(root, 'cli', 'cli.js')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: join(scripts, 'portable-cli.mjs'),
  plugins: [{
    // Replace @resvg/resvg-js with a stub that exports Resvg=null.
    // src/index.js keeps its static import unchanged; the null guard in renderPng
    // converts any PNG request into a clear error (exit code 1).
    name: 'portable-resvg-stub',
    setup(build) {
      build.onResolve({ filter: /^@resvg\/resvg-js$/ }, () => ({
        path: resolve(root, 'scripts', 'portable-shims', 'resvg-stub.mjs'),
      }));
    },
  }],
  banner: {
    // CJS globals pdfkit needs: require (for built-ins) + __dirname (for internal path resolution).
    js: 'import{createRequire}from"node:module";import{fileURLToPath as __fup}from"node:url";import{dirname as __dn}from"node:path";const require=createRequire(import.meta.url);const __filename=__fup(import.meta.url);const __dirname=__dn(__filename);',
  },
});

// Copy assets so that import.meta.url-relative paths resolve correctly.
// portable-cli.mjs is at  skills/infographic-studio/scripts/
// ../assets/fonts/          → skills/infographic-studio/assets/fonts/
// ../assets/icons/tabler/   → skills/infographic-studio/assets/icons/tabler/
// ../schema/                → skills/infographic-studio/schema/

const copyDir = async (src, dst) => {
  await mkdir(dst, { recursive: true });
  for (const name of await readdir(src)) {
    await copyFile(join(src, name), join(dst, name));
  }
};

await copyDir(join(root, 'assets', 'fonts'), join(skill, 'assets', 'fonts'));
await copyDir(join(root, 'assets', 'icons', 'tabler'), join(skill, 'assets', 'icons', 'tabler'));
await copyDir(join(root, 'schema'), join(skill, 'schema'));

// pdfkit resolves AFM font metrics and ICC profile via __dirname at runtime.
// In the bundle __dirname points to scripts/, so copy pdfkit's data/ there.
await rm(join(scripts, 'data'), { recursive: true, force: true });
await copyDir(join(root, 'node_modules', 'pdfkit', 'js', 'data'), join(scripts, 'data'));

console.log('Portable runtime built: skills/infographic-studio/scripts/portable-cli.mjs');
