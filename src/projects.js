import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { assertScene, inspectScene, resolveAssets } from './validate.js';
import { textEntries } from './labels.js';

export function listLabels(scene) {
  assertScene(scene);
  const entries = textEntries(scene);
  if (new Set(entries.map((e) => e.id)).size !== entries.length) throw new Error('Label IDs must be unique.');
  return Object.fromEntries(entries.map(({ id, text }) => [id, text]));
}

export function reviseLabels(scene, changes) {
  listLabels(scene);
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new Error('Labels must be an object mapping existing IDs to strings.');
  const revised = structuredClone(scene);
  const entries = new Map(textEntries(revised).map((e) => [e.id, e]));
  for (const [id, text] of Object.entries(changes)) {
    if (!entries.has(id)) throw new Error(`Unknown label: ${id}. Export the labels map to find supported IDs.`);
    if (typeof text !== 'string' || !text.trim()) throw new Error(`Label ${id} must be a nonempty string.`);
    const { owner, key } = entries.get(id);
    owner[key] = text;
  }
  assertScene(revised);
  return revised;
}

// Validate and read assets before creating a new directory. Existing projects are never overwritten.
export async function createProject(scene, { baseDir, outDir }) {
  assertScene(scene);
  const report = inspectScene(scene);
  if (!report.ok) throw new Error(`Cannot create project: ${report.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' ')}`);
  const assets = await resolveAssets(scene, baseDir);
  const copy = structuredClone(scene);
  const files = [];
  for (const [id, asset] of Object.entries(copy.assets ?? {})) {
    // Use a fresh canonical path so asset names cannot collide with scene.json or each other.
    asset.path = `assets/${id}${extname(asset.path).toLowerCase()}`;
    files.push([asset.path, Buffer.from(assets[id].uri.split(',')[1], 'base64')]);
  }
  const destination = resolve(outDir);
  await mkdir(dirname(destination), { recursive: true });
  await mkdir(destination); // fails if any file or directory already exists here
  for (const [path, bytes] of files) {
    await mkdir(dirname(resolve(destination, path)), { recursive: true });
    await writeFile(resolve(destination, path), bytes, { flag: 'wx' });
  }
  await writeFile(resolve(destination, 'scene.json'), JSON.stringify(copy, null, 2) + '\n', { flag: 'wx' });
  return resolve(destination, 'scene.json');
}
