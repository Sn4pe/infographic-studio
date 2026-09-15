import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { loadScene, inspectScene, assertScene, composeSvg, renderPng, renderPdf, renderScene, resolveAssets, planAssets, listLabels, reviseLabels, createProject } from '../src/index.js';
import { layoutText } from '../src/text.js';
import { wavePath } from '../src/render.js';
import { expandCallout, resolveTarget } from '../src/annotations.js';

const minimal = () => ({
  version: 1, title: 'A scientific figure', description: 'A waveform and a label.', width: 800, height: 500, theme: 'paper',
  sources: [{ title: 'Example source', url: 'https://example.org/source' }],
  panels: [{ id: 'panel', x: 52, y: 150, width: 696, height: 280, title: 'Propagation', elements: [
    { id: 'wave', type: 'wave', x: 32, y: 140, width: 600, amplitude: 20, cycles: 5, stroke: '$accent' },
    { id: 'label', type: 'text', x: 32, y: 196, width: 600, text: 'f₁ = f₂ · λ = v / f · Medio óptico', fontSize: 20 },
  ] }],
});

test('included examples pass strict mechanical checks and remain independent scenes', async () => {
  for (const name of ['windshield-frit', 'space/jwst-deployment', 'physical/heat-pump', 'architectures/kubernetes-cluster', 'biology/crispr-cas9', 'physical/ligo-interferometer', 'architectures/apache-kafka']) {
    const scene = await loadScene(new URL(`../examples/${name}/scene.json`, import.meta.url));
    assert.deepEqual(inspectScene(scene).issues, []);
  }
});

test('callout anchors follow object movement and resizing without mutating the scene', () => {
  const target = { id: 'object', type: 'rect', x: 300, y: 100, width: 200, height: 80 };
  const label = { id: 'note', type: 'callout', x: 20, y: 20, width: 150, fontSize: 20, text: 'Short label', target: { element: 'object', at: [0.25, 0.75] }, side: 'bottom' };
  const before = structuredClone(label);
  assert.deepEqual(resolveTarget(label, [target]), [350, 160]);
  target.x += 50;
  target.width *= 2;
  target.height *= 2;
  const expanded = expandCallout(label, [target]);
  assert.deepEqual([expanded[1].x, expanded[1].y], [450, 220]);
  assert.deepEqual(label, before);
  assert.equal(expanded[2].id, 'note');
  assert.equal(expanded[2].type, 'text');
  const shortStartY = Number(expanded[0].d.match(/^M[^,]+,([^ ]+)/)[1]);
  label.text = 'A longer label that wraps over several lines';
  const wrapped = expandCallout(label, [target]);
  const wrappedStartY = Number(wrapped[0].d.match(/^M[^,]+,([^ ]+)/)[1]);
  assert.ok(wrappedStartY > shortStartY, 'Leader must move below wrapped text');
  assert.deepEqual([wrapped[1].x, wrapped[1].y], [450, 220]);
});

test('callout validation rejects unresolved targets and warns about endpoints on text', () => {
  const scene = minimal();
  const note = { id: 'note', type: 'callout', x: 32, y: 80, width: 200, text: 'Material', target: { element: 'missing' } };
  scene.panels[0].elements.push(note);
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'callout-target' && i.severity === 'error'));
  note.target = [710, 160];
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'callout-bounds'));
  note.target = [40, 205];
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'callout-on-label'));
  note.target = { element: 'wave', at: [0.5, 0.5] };
  scene.panels[0].elements[0].rotation = 30;
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'callout-target'));
  delete scene.panels[0].elements[0].rotation;
  scene.panels[0].elements.push({ id: 'note-leader', type: 'line', x: 0, y: 0, x2: 1, y2: 1 });
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'duplicate-id'));
});

test('unframed panels omit title and border and check contrast against the canvas', () => {
  const scene = minimal();
  const panel = scene.panels[0];
  delete panel.title;
  panel.framed = false;
  panel.elements[1].y = 10;
  scene.palette = { background: '#ffffff', panel: '#000000', ink: '#000000', muted: '#333333' };
  assert.deepEqual(inspectScene(scene).issues, []);
  const svg = composeSvg(scene, {}, { embedFonts: false });
  assert.ok(!svg.includes('<text id="panel-title"'));
  const opening = svg.split('<g id="panel-panel"')[1].split('<g id="art-wave"')[0];
  assert.ok(!opening.includes('<rect'));
  panel.framed = true;
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'low-contrast'));
});

test('hybrid label correction preserves embedded illustration and its recorded hash', async () => {
  const baseDir = fileURLToPath(new URL('../examples/windshield-frit/', import.meta.url));
  const scene = await loadScene(join(baseDir, 'scene.json'));
  const first = await renderScene(scene, { baseDir, formats: ['svg'], strict: true });
  scene.panels[0].elements.find((e) => e.id === 'main-claim').text = 'The ceramic band protects the bonded edge.';
  const second = await renderScene(scene, { baseDir, formats: ['svg'], strict: true });
  const a = first.files['figure.svg'].toString(), b = second.files['figure.svg'].toString();
  const artwork = (svg) => svg.match(/<g id="art-windshield-corner"[\s\S]*?<\/g>/)[0];
  assert.equal(artwork(a), artwork(b));
  assert.deepEqual(first.report.assetHashes, second.report.assetHashes);
  assert.equal(listLabels(scene)['main-claim'], 'The ceramic band protects the bonded edge.');
  assert.ok(b.includes('<text id="main-claim"'));
});

test('schema rejects missing geometry, unsupported properties and injected paint', () => {
  for (const mutate of [
    (s) => { delete s.panels[0].elements[0].width; },
    (s) => { s.panels[0].elements[0].stroke = 'url(https://example.com/pixel)'; },
    (s) => { s.panels[0].elements[0].onload = 'alert(1)'; },
    (s) => { s.title = 'bad\u0001text'; },
    (s) => { s.panels[0].elements[0].cycles = 101; },
  ]) { const scene = minimal(); mutate(scene); assert.throws(() => assertScene(scene)); }
});

test('label wrapping uses actual font metrics and preserves explicit line breaks', () => {
  const layout = layoutText('Wide words\nA second paragraph', 120, 20);
  assert.equal(layout.lines[0], 'Wide words');
  assert.ok(layout.lines.length >= 3);
  assert.ok(layout.widths.every((width) => width <= 120));
  assert.equal(layoutText('a\n\nb', 100).lines.length, 3);
});

test('checks catch clipping, duplicate IDs, missing glyphs and title collisions', () => {
  const scene = minimal();
  scene.panels[0].elements.push({ id: 'label', type: 'text', x: 680, y: 30, width: 100, text: '😀', fontSize: 20 });
  const codes = inspectScene(scene).issues.map((i) => i.code);
  for (const expected of ['duplicate-id', 'missing-glyph', 'label-bounds']) assert.ok(codes.includes(expected), expected);
  scene.panels[0].elements[1].y = 40;
  assert.ok(inspectScene(scene).issues.some((i) => i.code === 'label-overlap'));
});

test('declared text containers reject local overflow even when the panel itself has room', () => {
  const scene = minimal();
  scene.panels[0].elements.push({ id: 'card', type: 'rect', x: 300, y: 40, width: 130, height: 70, fill: '$panel', stroke: '$line' });
  scene.panels[0].elements.push({ id: 'card-label', type: 'text', x: 320, y: 80, width: 100, text: 'This label deliberately wraps outside its card.', fontSize: 18, container: 'card' });
  let issues = inspectScene(scene).issues;
  assert.ok(issues.some((issue) => issue.code === 'container-bounds' && issue.element === 'card-label'));
  scene.panels[0].elements.find((element) => element.id === 'card-label').container = 'missing-card';
  issues = inspectScene(scene).issues;
  assert.ok(issues.some((issue) => issue.code === 'unknown-container' && issue.element === 'card-label'));
});

test('long words and panels outside the body are errors', () => {
  const scene = minimal();
  scene.panels[0].elements[1].width = 10;
  scene.panels[0].y = 30;
  const codes = inspectScene(scene).issues.map((i) => i.code);
  assert.ok(codes.includes('text-overflow'));
  assert.ok(codes.includes('panel-bounds'));
});

test('label edits preserve the original artwork and XML text is escaped', () => {
  const scene = minimal();
  const first = composeSvg(scene, {}, { embedFonts: false });
  scene.panels[0].elements[1].text = 'Air & glass < boundary';
  const second = composeSvg(scene, {}, { embedFonts: false });
  const artwork = (svg) => svg.match(/<g id="art-wave"[\s\S]*?<\/g>/)[0];
  assert.equal(artwork(first), artwork(second));
  assert.ok(second.includes('Air &amp; glass &lt; boundary'));
  assert.ok(second.includes('<text id="label"'));
});

test('PNG dimensions respect scale and output is reproducible', () => {
  const svg = composeSvg(minimal());
  const a = renderPng(svg, 0.5), b = renderPng(svg, 0.5);
  assert.equal(a.readUInt32BE(16), 400);
  assert.equal(a.readUInt32BE(20), 250);
  assert.deepEqual(a, b);
  assert.throws(() => renderPng(svg, NaN));
  assert.throws(() => renderPng(svg, 10));
});

test('PDF preserves editable Unicode text and one-page dimensions', async () => {
  const scene = minimal();
  const bytes = await renderPdf(composeSvg(scene, {}, { embedFonts: false }), scene);
  const loading = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, verbosity: 0 });
  const doc = await loading.promise;
  assert.equal(doc.numPages, 1);
  const page = await doc.getPage(1);
  assert.deepEqual(page.view, [0, 0, 600, 375]);
  const text = (await page.getTextContent()).items.map((i) => i.str).join('');
  for (const value of ['f₁', 'f₂', 'λ', 'óptico']) assert.ok(text.includes(value), `Missing PDF text: ${value}`);
  await loading.destroy();
});

test('raster artwork embeds in SVG and PDF; labels remain text', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'infographic-assets-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'assets'));
  const bitmap = renderPng('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="9" fill="#ff0000"/></svg>', 1);
  await writeFile(join(dir, 'assets', 'sample.png'), bitmap);
  const scene = minimal();
  scene.assets = { sample: { path: 'assets/sample.png', description: 'A red circle.' } };
  scene.panels[0].elements.push({ id: 'sample', type: 'image', x: 580, y: 80, width: 50, height: 50, asset: 'sample' });
  const result = await renderScene(scene, { baseDir: dir, strict: true });
  assert.ok(result.files['figure.svg'].toString().includes('data:image/png;base64,'));
  assert.ok(result.files['figure.svg'].toString().includes('<text id="label"'));
  assert.equal(result.files['figure.pdf'].subarray(0, 5).toString(), '%PDF-');
  assert.ok(result.report.assetHashes.sample);
});

test('missing, escaped and invalid image files fail instead of leaving placeholders', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'infographic-invalid-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const scene = minimal();
  scene.assets = { art: { description: 'A reactor.' } };
  await assert.rejects(resolveAssets(scene, dir), /no path/);
  scene.assets.art.path = '../outside.png';
  await assert.rejects(resolveAssets(scene, dir), /inside/);
  scene.assets.art.path = 'missing.png';
  await assert.rejects(resolveAssets(scene, dir), /ENOENT/);
  scene.assets.art.path = 'invalid.png';
  await writeFile(join(dir, 'invalid.png'), '<svg/>');
  await assert.rejects(resolveAssets(scene, dir), /not a PNG or JPEG/);
});

test('asset planning works before generation and exposes exact placement dimensions', () => {
  const scene = minimal();
  scene.assets = { art: { description: 'A reactor.' } };
  scene.panels[0].elements.push({ id: 'art', type: 'image', x: 20, y: 80, width: 200, height: 100, asset: 'art' });
  const [plan] = planAssets(scene);
  assert.equal(plan.status, 'needs-illustration');
  assert.ok(plan.prompt.includes('No labels'));
  assert.deepEqual(plan.placements, [{ panel: 'panel', width: 200, height: 100 }]);
});

test('strict rendering fails on warnings; non-strict returns an honest report', async () => {
  const scene = minimal(); delete scene.sources;
  await assert.rejects(renderScene(scene, { formats: ['svg'], strict: true }), /No source/);
  const result = await renderScene(scene, { formats: ['svg'] });
  assert.equal(result.report.scientificReview, 'required');
  assert.ok(result.report.issues.some((i) => i.code === 'no-sources'));
  await assert.rejects(renderScene(minimal(), { formats: ['docx'] }), /Formats/);
});

test('wave coordinates use the requested baseline, width and amplitude', () => {
  const path = wavePath({ x: 10, y: 80, width: 300, amplitude: 12, cycles: 3 });
  assert.ok(path.startsWith('M10,80'));
  assert.ok(path.endsWith('L310,80'));
  const ys = [...path.matchAll(/[-\d.]+,([-\d.]+)/g)].map((m) => Number(m[1]));
  assert.ok(Math.min(...ys) >= 68 && Math.max(...ys) <= 92);
});

test('CLI init refuses overwrite; check failures have nonzero status; render produces files', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'infographic-cli-'));
  const dir = join(root, 'project');
  t.after(() => rm(root, { recursive: true, force: true }));
  const cli = (args) => spawnSync(process.execPath, ['cli/cli.js', ...args], { encoding: 'utf8' });
  assert.equal(cli(['init', dir]).status, 0);
  assert.notEqual(cli(['init', dir]).status, 0);
  assert.equal(cli(['check', join(dir, 'scene.json'), '--strict']).status, 0);
  const out = join(dir, 'export');
  const rendered = cli(['render', join(dir, 'scene.json'), '--formats', 'svg,png,pdf', '--scale', '0.5', '--out', out, '--strict']);
  assert.equal(rendered.status, 0, rendered.stderr);
  assert.ok((await readFile(join(out, 'figure.png'))).length > 1000);
  await writeFile(join(dir, 'bad.json'), '{"version":2}');
  assert.notEqual(cli(['check', join(dir, 'bad.json')]).status, 0);
  assert.notEqual(cli(['wat', join(dir, 'scene.json')]).status, 0);
});

test('print checks use actual output width, cover callouts and reject invalid options', async () => {
  const scene = minimal();
  scene.panels[0].elements.push({ id: 'note', type: 'callout', x: 32, y: 80, width: 200, text: 'Core', target: [300, 140], fontSize: 20 });
  const small = inspectScene(scene, { printWidthMm: 80 });
  assert.ok(small.issues.some((i) => i.code === 'print-small-text' && i.element === 'note'));
  const normal = inspectScene(scene, { printWidthMm: 180 });
  assert.deepEqual(normal.issues, []);
  const label = normal.print.labels.find((e) => e.id === 'note');
  assert.ok(Math.abs(label.fontSizePt - 20 * 180 / 800 * 72 / 25.4) < 1e-10);
  for (const options of [{ printWidthMm: 0 }, { printWidthMm: NaN }, { minFontPt: 8 }, { printWidthMm: 180, minFontPt: 0 }]) assert.throws(() => inspectScene(scene, options));
  await assert.rejects(renderScene(scene, { formats: ['svg'], strict: true, printWidthMm: 80 }), /pt at 80 mm/);
});

test('PDF exports at the requested millimetre width with correctly scaled text and unchanged SVG', async () => {
  const scene = minimal();
  const normal = await renderScene(scene, { formats: ['svg'], strict: true });
  const printed = await renderScene(scene, { formats: ['svg', 'pdf'], strict: true, printWidthMm: 180 });
  assert.deepEqual(normal.files['figure.svg'], printed.files['figure.svg']);
  const loading = getDocument({ data: new Uint8Array(printed.files['figure.pdf']), useSystemFonts: false, verbosity: 0 });
  try {
    const doc = await loading.promise;
    const page = await doc.getPage(1);
    const widthPt = 180 / 25.4 * 72;
    assert.ok(Math.abs(page.view[2] - widthPt) < 1e-4);
    assert.ok(Math.abs(page.view[3] - widthPt * scene.height / scene.width) < 1e-4);
    const items = (await page.getTextContent()).items.filter((i) => i.str.trim());
    assert.ok(items.some((i) => i.str.includes('f₁')));
    const title = items.find((i) => i.str.includes('A scientific figure'));
    assert.ok(Math.abs(title.transform[4] - 52 * widthPt / scene.width) < 0.01);
    assert.ok(Math.abs(title.height - 42 * widthPt / scene.width) < 0.01);
    for (const item of items) assert.ok(item.transform[4] >= 0 && item.transform[4] + item.width <= widthPt + 0.1);
  } finally { await loading.destroy(); }
});

test('label maps revise headers, panel titles and annotations without changing geometry', () => {
  const scene = minimal();
  const before = structuredClone(scene);
  const labels = listLabels(scene);
  assert.equal(labels['figure-title'], scene.title);
  assert.equal(labels['panel-title'], scene.panels[0].title);
  const revised = reviseLabels(scene, { 'figure-title': 'A revised figure', 'panel-title': 'Wave behaviour', label: 'Medio óptico · n₁' });
  assert.equal(revised.title, 'A revised figure');
  assert.equal(revised.panels[0].title, 'Wave behaviour');
  assert.equal(revised.panels[0].elements[1].text, 'Medio óptico · n₁');
  assert.deepEqual(revised.panels[0].elements[0], scene.panels[0].elements[0]);
  assert.deepEqual(scene, before);
  for (const changes of [{ unknown: 'Text' }, { label: '' }, { label: 12 }, [], null]) assert.throws(() => reviseLabels(scene, changes));
});

test('hybrid project copies source image bytes and refuses existing destinations', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'infographic-project-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baseDir = fileURLToPath(new URL('../examples/windshield-frit/', import.meta.url));
  const scene = await loadScene(join(baseDir, 'scene.json'));
  const before = structuredClone(scene);
  const path = await createProject(scene, { baseDir, outDir: join(root, 'copy') });
  const copy = await loadScene(path);
  const original = await readFile(join(baseDir, scene.assets['windshield-frit'].path));
  assert.deepEqual(await readFile(join(root, 'copy', copy.assets['windshield-frit'].path)), original);
  assert.deepEqual(scene, before);
  await assert.rejects(createProject(scene, { baseDir, outDir: join(root, 'copy') }), /EEXIST/);
  await renderScene(copy, { baseDir: join(root, 'copy'), formats: ['svg'], strict: true });
});

test('CLI supports an illustrated text revision and strict print failures without replacing source files', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'infographic-revision-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cli = (args) => spawnSync(process.execPath, ['cli/cli.js', ...args], { encoding: 'utf8' });
  const project = join(root, 'windshield');
  const initialized = cli(['init', project, '--example', 'windshield']);
  assert.equal(initialized.status, 0, initialized.stderr);
  const source = join(project, 'scene.json');
  const before = await readFile(source);
  const exported = cli(['labels', source]);
  assert.equal(JSON.parse(exported.stdout)['main-claim'], 'The black marks are a functional ceramic coating, not a decorative print.');
  const changes = join(root, 'changes.json');
  await writeFile(changes, JSON.stringify({ 'main-claim': 'The ceramic band protects the bonded edge.' }));
  const revision = join(root, 'revision');
  const revised = cli(['revise', source, '--labels', changes, '--out', revision, '--strict']);
  assert.equal(revised.status, 0, revised.stderr);
  assert.deepEqual(await readFile(source), before);
  assert.equal(listLabels(await loadScene(join(revision, 'scene.json')))['main-claim'], 'The ceramic band protects the bonded edge.');
  const checked = cli(['check', source, '--print-width', '180', '--strict']);
  assert.equal(checked.status, 1);
  assert.ok(checked.stdout.startsWith('FAIL:'));
  assert.notEqual(cli(['labels', source, '--scale', '2']).status, 0);
  await writeFile(changes, JSON.stringify({ 'main-claim': 'W'.repeat(1000) }));
  const bad = cli(['revise', source, '--labels', changes, '--out', join(root, 'bad'), '--strict']);
  assert.equal(bad.status, 1);
  await assert.rejects(readFile(join(root, 'bad', 'scene.json')), /ENOENT/);
});
