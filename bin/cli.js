#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScene, inspectScene, resolveAssets, renderFile, planAssets, listLabels, reviseLabels, createProject, listIcons, composeSpecification } from '../src/index.js';

const help = `Infographic Studio — illustrated figures, editable text, repeatable exports

  infographic-studio init <new-directory> [--example optics|sensing|editorial|technical|hybrid]
  infographic-studio check <scene.json> [--strict] [--json] [--print-width 180] [--min-font 8]
  infographic-studio render <scene.json> [--out directory] [--formats svg,png,pdf] [--scale 2] [--strict] [--print-width 180] [--min-font 8]
  infographic-studio assets <scene.json> [--out plan.json]
  infographic-studio labels <scene.json> [--out labels.json]
  infographic-studio revise <scene.json> --labels changes.json --out <new-directory> [--strict]
  infographic-studio icons [search] [--json]
  infographic-studio compose <specification.json> --out <new-scene.json>

init creates an editable scene. check validates layout and local assets.
compose expands a semantic document or scene + placements; then use check and render.
render exports offline, using bundled fonts. --strict also fails on warnings.
assets prepares text-free illustration briefs; it never calls a paid API.
labels exports editable text by ID. revise creates a separate project with copied assets.
--print-width sets PDF width in mm and checks printed text size. --min-font is in points.
Node.js 22+. No browser, service or API key required for the included examples.`;

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean', short: 'h' }, strict: { type: 'boolean' }, json: { type: 'boolean' },
    out: { type: 'string' }, formats: { type: 'string' }, scale: { type: 'string' }, example: { type: 'string' },
    labels: { type: 'string' }, 'print-width': { type: 'string' }, 'min-font': { type: 'string' },
  } });
  const [command, file] = positionals;
  const allowed = { init: ['example'], check: ['strict', 'json', 'print-width', 'min-font'], render: ['out', 'formats', 'scale', 'strict', 'print-width', 'min-font'], assets: ['out'], labels: ['out'], revise: ['labels', 'out', 'strict'], icons: ['json'], compose: ['out'] };
  if (!values.help && allowed[command]) for (const option of Object.keys(values)) if (!allowed[command].includes(option)) throw new Error(`--${option} is not supported by ${command}.`);
  const printOptions = { printWidthMm: values['print-width'] === undefined ? undefined : Number(values['print-width']), minFontPt: values['min-font'] === undefined ? undefined : Number(values['min-font']) };
  if (values.help || !command) { console.log(help); }
  else if (command === 'icons') {
    if (positionals.length > 2) throw new Error('Quote a multiword icon query.');
    const icons = listIcons(file);
    console.log(values.json ? JSON.stringify(icons, null, 2) : icons.map((i) => `${i.name} · ${i.family} · ${i.license}`).join('\n'));
  }
  else if (!file || positionals.length !== 2) throw new Error('Expected one scene path or directory. Use --help.');
  else if (command === 'compose') {
    if (!values.out) throw new Error('compose requires --out <new-scene.json>.');
    const scene = composeSpecification(JSON.parse(await readFile(file,'utf8')));
    if (Object.keys(scene.assets??{}).length && dirname(resolve(file)) !== dirname(resolve(values.out))) throw new Error('Keep the composed scene beside its specification so relative assets remain valid.');
    await writeFile(values.out,JSON.stringify(scene,null,2)+'\n',{flag:'wx'});
    console.log(`Created ${resolve(values.out)}. Layout has not been approved; run check --strict and inspect the render.`);
  }
  else if (command === 'init') {
    const example = values.example ?? 'optics';
    const examples = { optics: 'optics', sensing: 'sensing', editorial: 'fiber-study/editorial', technical: 'fiber-study/technical', hybrid: 'fiber-study/hybrid' };
    if (!Object.hasOwn(examples, example)) throw new Error(`Example must be ${Object.keys(examples).join(', ')}.`);
    const source = fileURLToPath(new URL(`../examples/${examples[example]}/scene.json`, import.meta.url));
    const created = await createProject(await loadScene(source), { baseDir: dirname(source), outDir: file });
    console.log(`Created ${created}\nEdit the scene, then run: infographic-studio render "${created}"`);
  } else if (command === 'check') {
    const scene = await loadScene(file);
    const report = inspectScene(scene, printOptions);
    try { await resolveAssets(scene, dirname(resolve(file))); }
    catch (error) { report.ok = false; report.issues.push({ severity: 'error', code: 'asset', element: 'assets', message: error.message }); }
    const passed = report.ok && !(values.strict && report.issues.length);
    console.log(values.json ? JSON.stringify(report, null, 2) : `${passed ? 'PASS' : 'FAIL'}: ${file}\n${report.issues.map((i) => `${i.severity}: ${i.element} — ${i.message}`).join('\n')}\nScientific review: required. Visual review: required.`);
    if (!report.ok || (values.strict && report.issues.length)) process.exitCode = 1;
  } else if (command === 'render') {
    const report = await renderFile(file, { outDir: values.out ?? 'output', formats: values.formats?.split(','), scale: values.scale === undefined ? 2 : Number(values.scale), strict: values.strict, ...printOptions });
    console.log(`Exported ${report.exports.join(', ')} and report.json to ${resolve(values.out ?? 'output')}`);
    for (const issue of report.issues) console.warn(`${issue.severity}: ${issue.element} — ${issue.message}`);
  } else if (command === 'assets') {
    const plan = JSON.stringify(planAssets(await loadScene(file)), null, 2) + '\n';
    if (values.out) await writeFile(values.out, plan); else process.stdout.write(plan);
  } else if (command === 'labels') {
    const labels = JSON.stringify(listLabels(await loadScene(file)), null, 2) + '\n';
    if (values.out) await writeFile(values.out, labels, { flag: 'wx' }); else process.stdout.write(labels);
  } else if (command === 'revise') {
    if (!values.labels || !values.out) throw new Error('revise requires --labels changes.json and --out <new-directory>.');
    const scene = reviseLabels(await loadScene(file), JSON.parse(await readFile(values.labels, 'utf8')));
    const report = inspectScene(scene);
    if (!report.ok || (values.strict && report.issues.length)) throw new Error(`Revision failed layout checks:\n${report.issues.map((i) => `${i.severity}: ${i.element}: ${i.message}`).join('\n')}`);
    const created = await createProject(scene, { baseDir: dirname(resolve(file)), outDir: values.out });
    console.log(`Created revision ${created}\nRender it with: infographic-studio render "${created}" --strict`);
    for (const issue of report.issues) console.warn(`${issue.severity}: ${issue.element} — ${issue.message}`);
  } else throw new Error(`Unknown command: ${command}. Use --help.`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
