import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import { fontPaths } from './text.js';
import { assertScene, inspectScene, resolveAssets } from './validate.js';
import { composeSvg } from './render.js';
import { printSize } from './print.js';
import { sceneIcons, iconCredits } from './icons.js';

export { assertScene, inspectScene, resolveAssets, composeSvg };
export { themes } from './themes.js';
export { listLabels, reviseLabels, createProject } from './projects.js';
export { listIcons } from './icons.js';
export { createIllustration, listIllustrations, illustrationProfile } from './illustrations.js';
export { createComponent, composeComponents, createSection, listComponents, componentProfile } from './components.js';
export { composeSpecification } from './specification.js';
export { composeDocument } from './document.js';
export { assertDocument } from './document-schema.js';

export async function loadScene(file) {
  const scene = JSON.parse(await readFile(file, 'utf8'));
  assertScene(scene);
  return scene;
}

export function renderPng(svg, scale = 2) {
  if (!Number.isFinite(scale) || scale < 0.25 || scale > 4) throw new Error('Scale must be between 0.25 and 4.');
  return new Resvg(svg, { font: { fontFiles: Object.values(fontPaths), loadSystemFonts: false }, fitTo: { mode: 'zoom', value: scale } }).render().asPng();
}

export async function renderPdf(svg, scene, { printWidthMm } = {}) {
  const warnings = [];
  const pointsPerPixel = printWidthMm === undefined ? 0.75 : printSize(scene, printWidthMm).pointsPerPixel;
  const doc = new PDFDocument({ size: [scene.width * pointsPerPixel, scene.height * pointsPerPixel], margin: 0, info: { Title: scene.title, Subject: scene.description, Creator: 'Infographic Studio' } });
  const chunks = [];
  const done = new Promise((resolve, reject) => { doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  doc.registerFont('Studio', fontPaths.regular);
  doc.registerFont('Studio-Semibold', fontPaths.semibold);
  doc.scale(pointsPerPixel / 0.75);
  SVGtoPDF(doc, svg, 0, 0, {
    fontCallback: (_family, bold) => bold ? 'Studio-Semibold' : 'Studio',
    warningCallback: (warning) => warnings.push(warning),
  });
  doc.end();
  const bytes = await done;
  if (warnings.length) throw new Error(`PDF export warnings:\n${warnings.join('\n')}`);
  return bytes;
}

export async function renderScene(scene, { baseDir = process.cwd(), formats = ['svg', 'png', 'pdf'], scale = 2, strict = false, printWidthMm, minFontPt } = {}) {
  assertScene(scene);
  if (!formats.length || formats.some((f) => !['svg', 'png', 'pdf'].includes(f))) throw new Error('Formats must be svg, png and/or pdf.');
  const report = inspectScene(scene, { printWidthMm, minFontPt });
  if (!report.ok || (strict && report.issues.length)) throw new Error(`Scene check failed:\n${report.issues.map((i) => `${i.severity}: ${i.element}: ${i.message}`).join('\n')}`);
  const assets = await resolveAssets(scene, baseDir);
  const svg = composeSvg(scene, assets);
  const files = {};
  // Generate everything before writing any output, so a failed PDF cannot leave a partial set.
  if (formats.includes('svg')) files['figure.svg'] = Buffer.from(svg);
  if (formats.includes('png')) files['figure.png'] = renderPng(svg, scale);
  if (formats.includes('pdf')) files['figure.pdf'] = await renderPdf(composeSvg(scene, assets, { embedFonts: false }), scene, { printWidthMm });
  report.sourceHash = createHash('sha256').update(JSON.stringify(scene)).digest('hex');
  report.assetHashes = Object.fromEntries(Object.entries(assets).map(([id, a]) => [id, createHash('sha256').update(a.uri).digest('hex')]));
  const icons = sceneIcons(scene);
  if (icons.length) {
    report.icons = icons.map(({ paths, tags, ...metadata }) => metadata);
    files['credits.txt'] = Buffer.from(iconCredits(scene));
  }
  report.exports = Object.keys(files);
  files['report.json'] = Buffer.from(JSON.stringify(report, null, 2) + '\n');
  return { files, report };
}

export async function renderFile(file, { outDir = 'output', ...options } = {}) {
  const scene = await loadScene(file);
  const result = await renderScene(scene, { ...options, baseDir: dirname(resolve(file)) });
  await mkdir(outDir, { recursive: true });
  for (const [name, data] of Object.entries(result.files)) await writeFile(resolve(outDir, name), data);
  return result.report;
}

export function planAssets(scene) {
  assertScene(scene);
  return Object.entries(scene.assets ?? {}).map(([id, asset]) => ({
    id, status: asset.path ? 'path-specified' : 'needs-illustration',
    output: asset.path ?? `assets/${id}.png`,
    prompt: `${asset.prompt ?? asset.description}\nStyle: ${scene.theme ?? 'blueprint'}. Create only the illustration, with generous negative space. No labels, letters, numbers, logos or watermarks. Labels are composed separately as editable vector text.`,
    placements: scene.panels.flatMap((p) => p.elements.filter((e) => e.type === 'image' && e.asset === id).map((e) => ({ panel: p.id, width: e.width, height: e.height }))),
  }));
}
