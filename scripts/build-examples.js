import { renderFile } from '../src/index.js';
import { fileURLToPath } from 'node:url';

for (const name of ['optics', 'sensing', 'fiber-study/editorial', 'fiber-study/technical', 'fiber-study/hybrid', 'document-layout']) {
  const path = fileURLToPath(new URL(`../examples/${name}/scene.json`, import.meta.url));
  const outDir = fileURLToPath(new URL(`../examples/${name}/rendered/`, import.meta.url));
  const report = await renderFile(path, { outDir, strict: true, scale: 1.5 });
  console.log(`${name}: ${report.exports.join(', ')}`);
}
