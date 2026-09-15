import { writeFile } from 'node:fs/promises';
import { renderFile } from '../src/index.js';
import { fileURLToPath } from 'node:url';
import { heatPump } from './gallery/heat-pump.js';
import { webb } from './gallery/webb.js';
import { kubernetes } from './gallery/kubernetes.js';
import { crispr } from './gallery/crispr.js';
import { ligo } from './gallery/ligo.js';
import { kafka } from './gallery/kafka.js';

for (const name of ['windshield-frit']) {
  const path = fileURLToPath(new URL(`../examples/${name}/scene.json`, import.meta.url));
  const outDir = fileURLToPath(new URL(`../examples/${name}/rendered/`, import.meta.url));
  const report = await renderFile(path, { outDir, strict: true, scale: 1.5 });
  console.log(`${name}: ${report.exports.join(', ')}`);
}

for (const { name, build } of [
  { name: 'architectures/kubernetes-cluster', build: kubernetes },
  { name: 'space/jwst-deployment', build: webb },
  { name: 'physical/heat-pump', build: heatPump },
  { name: 'biology/crispr-cas9', build: crispr },
  { name: 'physical/ligo-interferometer', build: ligo },
  { name: 'architectures/apache-kafka', build: kafka }
]) {
  const scene = fileURLToPath(new URL(`../examples/${name}/scene.json`, import.meta.url));
  await writeFile(scene, JSON.stringify(build(), null, 2) + '\n');
  const report = await renderFile(scene, { outDir: fileURLToPath(new URL(`../examples/${name}/rendered/`, import.meta.url)), strict: true, scale: 1.5 });
  console.log(`${name}: ${report.exports.join(', ')}`);
}
