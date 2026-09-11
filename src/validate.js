import Ajv from 'ajv';
import { readFile, realpath, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, extname } from 'node:path';
import { layoutText, missingGlyphs } from './text.js';
import { paletteFor, contrast } from './themes.js';
import { expandScene, resolveTarget } from './annotations.js';
import { inspectPrint } from './print.js';
import { getIcon } from './icons.js';
import { inspectCollisions } from './collisions.js';

const schema = JSON.parse(readFileSync(new URL('../schema/scene.schema.json', import.meta.url), 'utf8'));
const validateSchema = new Ajv({ allErrors: true, strictRequired: false }).compile(schema);
export function assertScene(scene) {
  if (!validateSchema(scene)) {
    throw new Error('Invalid scene:\n' + validateSchema.errors.map((e) => `  ${e.instancePath || '/'}: ${e.message}`).join('\n'));
  }
  const pending = [scene];
  while (pending.length) {
    const value = pending.pop();
    if (value && typeof value === 'object') pending.push(...Object.values(value));
    else if (typeof value === 'string' && /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new Error('Scene contains control characters unsupported by XML.');
  }
}

export async function resolveAssets(scene, baseDir) {
  const assets = {};
  const root = await realpath(baseDir);
  for (const [id, asset] of Object.entries(scene.assets ?? {})) {
    if (!asset.path) throw new Error(`Asset ${id} has no path. Run "assets" to get the illustration brief, then add a local PNG or JPEG.`);
    const file = resolve(baseDir, asset.path);
    const rel = relative(resolve(baseDir), file);
    if (isAbsolute(asset.path) || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)) {
      throw new Error(`Asset ${id} must be inside the scene directory.`);
    }
    if (!['.png', '.jpg', '.jpeg'].includes(extname(file).toLowerCase())) throw new Error(`Asset ${id}: use a PNG or JPEG. Author editable vectors with scene primitives.`);
    const realRel = relative(root, await realpath(file));
    if (realRel === '..' || realRel.startsWith('..\\') || realRel.startsWith('../') || isAbsolute(realRel)) throw new Error(`Asset ${id} resolves outside the scene directory.`);
    if ((await stat(file)).size > 20 * 1024 * 1024) throw new Error(`Asset ${id} exceeds 20 MB.`);
    const bytes = await readFile(file);
    if (bytes.length > 20 * 1024 * 1024) throw new Error(`Asset ${id} exceeds 20 MB.`);
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpeg) throw new Error(`Asset ${id} is not a PNG or JPEG.`);
    assets[id] = { uri: `data:image/${png ? 'png' : 'jpeg'};base64,${bytes.toString('base64')}`, description: asset.description };
  }
  return assets;
}

const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function inspectScene(scene, { printWidthMm, minFontPt } = {}) {
  assertScene(scene);
  const issues = [];
  const original = scene;
  const print = printWidthMm === undefined ? undefined : inspectPrint(scene, printWidthMm, minFontPt);
  if (minFontPt !== undefined && printWidthMm === undefined) throw new Error('Minimum print font size requires a print width.');
  if (print) issues.push(...print.issues);
  try { scene = expandScene(scene); }
  catch (error) { return { ok: false, issues: [...issues, { severity: 'error', code: 'callout-target', element: 'callouts', message: error.message }], scientificReview: 'required', visualReview: 'required' }; }
  const palette = paletteFor(scene);
  const ids = new Set(['figure-title', 'figure-eyebrow', 'figure-subtitle', 'figure-footer', 'scene-title', 'scene-description', 'studio-grid', 'icon-credits']);
  const add = (severity, code, element, message) => issues.push({ severity, code, element, message });
  const id = (value) => {
    if (ids.has(value)) add('error', 'duplicate-id', value, 'IDs must be unique across the scene.');
    ids.add(value);
  };
  const textBox = (e, background) => {
    const size = e.fontSize ?? 20;
    const weight = e.weight ?? 'regular';
    const layout = layoutText(e.text, e.width, size, weight);
    if (layout.widths.some((w) => w > e.width + 0.1)) add('error', 'text-overflow', e.id, 'A word exceeds its text box width. Increase width or add a line break.');
    const missing = missingGlyphs(e.text, weight);
    if (missing.length) add('error', 'missing-glyph', e.id, `Bundled font does not support: ${missing.join(' ')}.`);
    if (size < 16) add('warning', 'small-text', e.id, 'Text below 16 px may be difficult to read in a report.');
    const fill = e.fill ?? '$ink';
    const color = fill.startsWith('$') ? palette[fill.slice(1)] : fill;
    if (color !== 'none' && contrast(color, background) < 3) add('warning', 'low-contrast', e.id, 'Text contrast against the panel/background is below 3:1.');
    return { x: e.x, y: e.y, w: e.width, h: layout.height };
  };
  const header = textBox({ id: 'figure-title', text: scene.title, width: scene.width - 104, x: 52, y: 50, fontSize: 42, weight: 'semibold' }, palette.background);
  const subtitle = scene.subtitle ? textBox({ id: 'figure-subtitle', text: scene.subtitle, width: scene.width - 104, x: 52, y: header.y + header.h + 8, fontSize: 20, fill: '$muted' }, palette.background) : header;
  const headerBottom = subtitle.y + subtitle.h + 24;
  if (scene.eyebrow) textBox({ id: 'figure-eyebrow', text: scene.eyebrow, width: scene.width - 104, x: 52, y: 23, fontSize: 16, weight: 'semibold' }, palette.background);
  if (scene.footer) {
    const footer = textBox({ id: 'figure-footer', text: scene.footer, width: scene.width - 104, x: 52, y: scene.height - 44, fontSize: 16, fill: '$muted' }, palette.background);
    if (footer.h > 36) add('error', 'footer-overflow', 'figure-footer', 'Footer must fit in the bottom margin.');
  }
  for (const [i, panel] of scene.panels.entries()) {
    id(panel.id);
    id(`${panel.id}-title`);
    id(`${panel.id}-kicker`);
    if (panel.x + panel.width > scene.width || panel.y + panel.height > scene.height - 60 || panel.y < headerBottom) {
      add('error', 'panel-bounds', panel.id, `Panel must fit between header (${Math.ceil(headerBottom)} px) and footer (${scene.height - 60} px).`);
    }
    for (const other of scene.panels.slice(0, i)) {
      if (intersects({ x: panel.x, y: panel.y, w: panel.width, h: panel.height }, { x: other.x, y: other.y, w: other.width, h: other.height })) add('error', 'panel-overlap', panel.id, `Overlaps ${other.id}.`);
    }
    const labelBoxes = [];
    const panelBackground = panel.framed === false ? palette.background : palette.panel;
    if (panel.title) {
      const title = textBox({ id: `${panel.id}-title`, x: 24, y: 36, width: panel.width - 48, text: panel.title, fontSize: 25, weight: 'semibold' }, panelBackground);
      labelBoxes.push({ ...title, id: `${panel.id}-title` });
    }
    if (panel.kicker) {
      const kicker = textBox({ id: `${panel.id}-kicker`, x: 24, y: 14, width: panel.width - 48, text: panel.kicker, fontSize: 16, weight: 'semibold', fill: '$secondary' }, panelBackground);
      if (kicker.h > 23) add('error', 'kicker-overflow', panel.id, 'Kicker must fit on one line.');
    }
    for (const element of panel.elements) {
      id(element.id);
      if (element.type === 'icon') {
        try { getIcon(element.icon); } catch (error) { add('error', 'unknown-icon', element.id, error.message); }
        if (element.x < 0 || element.y < 0 || element.x + element.width > panel.width || element.y + element.height > panel.height) add('error', 'icon-bounds', element.id, 'Icon extends outside its panel.');
        if (element.fill && element.fill !== 'none') add('error', 'icon-style', element.id, 'Outline icons cannot use a fill. Use a separate background shape.');
      }
      if (element.type === 'image' && !scene.assets?.[element.asset]) add('error', 'unknown-asset', element.id, `Unknown asset ${element.asset}.`);
      if (element.type === 'text') {
        const box = textBox(element, panelBackground);
        if (box.x < 0 || box.y < 0 || box.x + box.w > panel.width || box.y + box.h > panel.height) add('error', 'label-bounds', element.id, 'Text extends outside its panel.');
        for (const previous of labelBoxes) if (intersects(box, previous)) add('warning', 'label-overlap', element.id, `Text box overlaps ${previous.id}.`);
        labelBoxes.push({ ...box, id: element.id });
        if (element.rotation) add('warning', 'rotated-label', element.id, 'Bounds checks use the unrotated label; inspect the rotated result.');
      }
    }
    const originalPanel = original.panels[i];
    issues.push(...inspectCollisions(panel));
    for (const callout of originalPanel.elements.filter((e) => e.type === 'callout')) {
      const [tx, ty] = resolveTarget(callout, originalPanel.elements);
      if (tx < 0 || ty < 0 || tx > panel.width || ty > panel.height) add('error', 'callout-bounds', callout.id, 'Annotation target lies outside its panel.');
      for (const box of labelBoxes) if (tx >= box.x && tx <= box.x + box.w && ty >= box.y && ty <= box.y + box.h) add('warning', 'callout-on-label', callout.id, `Annotation ends inside text box ${box.id}.`);
    }
  }
  if (!scene.sources?.length) add('warning', 'no-sources', 'figure', 'No source references recorded. Technical claims require human review.');
  return { ok: !issues.some((i) => i.severity === 'error'), issues, ...(print ? { print: { widthMm: print.widthMm, heightMm: print.heightMm, minFontPt: print.minFontPt, labels: print.labels } } : {}), scientificReview: 'required', visualReview: 'required', scope: 'Schema, text metrics, glyphs, panel geometry, contrast, declared artwork bounds, later opaque rectangle/ellipse/image bounds, and straight connector segments. Conservative collision warnings; curved paths, rotations, raster transparency and semantic correctness still need visual review.' };
}
