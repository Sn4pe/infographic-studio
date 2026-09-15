import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { kubernetes } from '../scripts/gallery/kubernetes.js';
import { webb } from '../scripts/gallery/webb.js';
import { heatPump } from '../scripts/gallery/heat-pump.js';
import { crispr } from '../scripts/gallery/crispr.js';
import { ligo } from '../scripts/gallery/ligo.js';
import { kafka } from '../scripts/gallery/kafka.js';
import { inspectScene, composeSvg, renderPng } from '../src/index.js';
import { inspectCollisions } from '../src/collisions.js';

test('published scenes match their maintained builders and pass layout checks', async () => {
  for (const [name, build] of [['architectures/kubernetes-cluster', kubernetes], ['space/jwst-deployment', webb], ['physical/heat-pump', heatPump], ['biology/crispr-cas9', crispr], ['physical/ligo-interferometer', ligo], ['architectures/apache-kafka', kafka]]) {
    const published = JSON.parse(await readFile(new URL(`../examples/${name}/scene.json`, import.meta.url), 'utf8'));
    assert.deepEqual(published, build(), `${name} is stale: run npm run examples`);
    assert.deepEqual(inspectScene(published).issues, [], `${name} has layout findings`);
    const digest = bytes => createHash('sha256').update(bytes).digest('hex');
    const svg = composeSvg(published);
    for (const [format, generated] of [['svg', svg], ['png', renderPng(svg, 1.5)]]) {
      const exported = await readFile(new URL(`../examples/${name}/rendered/figure.${format}`, import.meta.url));
      assert.equal(digest(exported), digest(generated), `${name} has an outdated ${format.toUpperCase()} export: run npm run examples`);
    }
  }
});

test('wide arrowheads detect off-axis text while allowing text outside their triangle', () => {
  const arrow = { id: 'flow', type: 'arrow', x: 20, y: 100, x2: 300, y2: 100, stroke: '$accent', strokeWidth: 40 };
  const label = { id: 'label', type: 'text', text: 'Heat', x: 175, y: 50, width: 32, fontSize: 12 };
  const panel = { id: 'test', width: 400, height: 300, elements: [arrow, label] };
  const findings = inspectCollisions(panel);
  assert.ok(findings.some(i => i.code === 'arrowhead-label-crossing'));
  assert.ok(!findings.some(i => i.code === 'connector-label-crossing'), 'The shaft must miss this label');
  label.x = 270;
  assert.ok(!inspectCollisions(panel).some(i => i.code === 'arrowhead-label-crossing'), 'A rectangular head bound would falsely flag this near miss');
  arrow.x2 = arrow.x; arrow.y2 = arrow.y;
  assert.ok(!inspectCollisions(panel).some(i => i.code === 'arrowhead-label-crossing'), 'A zero-length arrow has no head area');
});
