import test from 'node:test';
import assert from 'node:assert/strict';
import { composeInfographic, composeSpecification, inspectScene, renderScene, assertInfographic, listInfographicStructures } from '../src/index.js';

const source = [{ title: 'Fixture', url: 'https://example.org/fixture' }];

test('the structure catalog exposes supported semantic layouts without leaking mutable state', () => {
  const first = listInfographicStructures();
  assert.deepEqual(first.map(structure => structure.type), ['sequence', 'timeline', 'feedback-loop', 'relationship', 'neighborhood', 'hierarchy', 'tree', 'architecture-overview', 'matrix', 'bar-chart', 'comparison']);
  first[0].title = 'Mutated';
  assert.equal(listInfographicStructures()[0].title, 'Sequence');
});

test('semantic sequence infers its ordered connections and compiles to an editable scene', async () => {
  const infographic = {
    title: 'Release path', description: 'A synthetic sequence.', width: 1600, sources: source,
    structure: { type: 'sequence', title: 'From draft to release', items: [
      { id: 'draft', component: 'document', title: 'Draft', description: 'Capture the proposed change.' },
      { id: 'review', component: 'person', title: 'Review', description: 'Inspect the evidence and implementation.' },
      { id: 'release', component: 'container', title: 'Release', description: 'Publish the reviewed result.' }
    ] }
  };
  const scene = composeInfographic(infographic);
  assert.ok(scene.panels[0].elements.some(element => element.id === 'draft-to-review-segment-1'));
  assert.deepEqual(inspectScene(scene).issues, []);
  await renderScene(scene, { formats: ['svg'], strict: true });
});

test('semantic comparison calculates contained cards from both sides without author coordinates', () => {
  const infographic = {
    title: 'Frit band and dot matrix', description: 'A synthetic comparison.', width: 1600, sources: source,
    structure: { type: 'comparison', title: 'Different roles at the edge', description: 'Both are ceramic markings on automotive glass.', sides: [
      { id: 'band', title: 'Solid frit band', description: 'Opaque ceramic perimeter.', items: [
        { id: 'uv', title: 'UV shield', description: 'Protects the bond line.' },
        { id: 'mask', title: 'Masking', description: 'Hides the adhesive line.' }
      ] },
      { id: 'dots', title: 'Dot matrix', description: 'A fading ceramic pattern.', items: [
        { id: 'thermal', title: 'Thermal transition', description: 'Reduces the abrupt change toward clear glass.' },
        { id: 'visual', title: 'Visual transition', description: 'Makes the opaque edge less abrupt.' }
      ] }
    ] }
  };
  const scene = composeSpecification({ infographic });
  assert.ok(scene.panels[0].elements.some(element => element.id === 'band-side'));
  assert.equal(scene.panels[0].elements.find(element => element.id === 'dots-thermal-title').container, 'dots-thermal');
  assert.deepEqual(inspectScene(scene).issues, []);
});

test('semantic relationship and hierarchy reuse the layered topology compositor', () => {
  const base = {
    title: 'System structure', description: 'A synthetic relationship.', width: 1600, sources: source,
    structure: { type: 'relationship', title: 'Layered relationship', groups: [
      { id: 'entry', title: 'Entry', items: ['client'] },
      { id: 'service', title: 'Service', items: ['api', 'store'] }
    ], items: [
      { id: 'client', component: 'device', title: 'Client', description: 'Starts a request.' },
      { id: 'api', component: 'network', title: 'API', description: 'Handles the request.' },
      { id: 'store', component: 'container', title: 'Store', description: 'Persists the result.' }
    ], relations: [{ id: 'client-api', from: 'client', to: 'api' }, { id: 'api-store', from: 'api', to: 'store' }] }
  };
  const relationship = composeInfographic(base);
  assert.ok(relationship.panels[0].elements.some(element => element.id === 'client-card'));
  const hierarchy = composeInfographic({ ...base, structure: { ...base.structure, type: 'hierarchy' } });
  assert.ok(hierarchy.panels[0].elements.some(element => element.id === 'service-band'));
  assert.throws(() => assertInfographic({ ...base, structure: { type: 'unknown' } }), /Invalid infographic/);
});

test('architecture overview makes one declared journey visible without dropping context cards', () => {
  const infographic = {
    title: 'Overview', description: 'A synthetic architecture overview.', width: 1600, sources: source,
    structure: { type: 'architecture-overview', groups: [
      { id: 'entry', title: 'Entry', items: ['client'] },
      { id: 'platform', title: 'Platform', items: ['api', 'store'] },
      { id: 'node', title: 'Node', items: ['agent'] }
    ], items: [
      { id: 'client', component: 'person', title: 'Client' },
      { id: 'api', component: 'device', title: 'API' },
      { id: 'store', component: 'grid', title: 'Store' },
      { id: 'agent', component: 'container', title: 'Agent' }
    ], relations: [
      { id: 'client-api', from: 'client', to: 'api' },
      { id: 'api-store', from: 'api', to: 'store' },
      { id: 'api-agent', from: 'api', to: 'agent' }
    ], journey: ['client-api', 'api-agent'] }
  };
  const scene = composeInfographic(infographic);
  assert.ok(scene.panels[0].elements.some(element => element.id === 'store-card'));
  assert.ok(!scene.panels[0].elements.some(element => element.id.startsWith('api-store-segment-')));
  assert.deepEqual(inspectScene(scene).issues, []);
});

test('timeline and decision matrix use distinct spatial grammars rather than card-row aliases', () => {
  const base = { width: 1600, sources: source };
  const timeline = composeInfographic({ ...base, title: 'Milestones', description: 'A synthetic timeline.', structure: { type: 'timeline', items: [
    { id: 'observe', date: '01', title: 'Observe', description: 'Capture the first signal.' },
    { id: 'test', date: '02', title: 'Test', description: 'Compare the result.' },
    { id: 'report', date: '03', title: 'Report', description: 'Share the conclusion.' }
  ] } });
  assert.ok(timeline.panels[0].elements.some(element => element.id === 'timeline-spine'));
  assert.equal(timeline.panels[0].elements.filter(element => element.id.endsWith('-dot')).length, 3);
  assert.deepEqual(inspectScene(timeline).issues, []);
  const matrix = composeInfographic({ ...base, title: 'Decision space', description: 'A synthetic matrix.', structure: { type: 'matrix', xAxis: 'Effort', yAxis: 'Impact', quadrants: [
    { id: 'quick', title: 'Quick wins', description: 'High impact at low effort.' },
    { id: 'major', title: 'Major projects', description: 'High impact at high effort.' },
    { id: 'minor', title: 'Fill-ins', description: 'Low impact at low effort.' },
    { id: 'avoid', title: 'Avoid', description: 'Low impact at high effort.' }
  ] } });
  assert.ok(matrix.panels[0].elements.some(element => element.id === 'matrix-horizontal-axis'));
  assert.equal(matrix.panels[0].elements.filter(element => element.id.endsWith('-card')).length, 4);
  assert.deepEqual(inspectScene(matrix).issues, []);
});

test('feedback, tree, neighborhood and bar chart use bounded visual grammars', () => {
  const base = { width: 1600, sources: source };
  const loop = composeInfographic({ ...base, title: 'Control feedback', description: 'A synthetic feedback loop.', structure: { type: 'feedback-loop', items: [
    { id: 'measure', title: 'Measure', description: 'Read the current state.' },
    { id: 'compare', title: 'Compare', description: 'Find the deviation.' },
    { id: 'adjust', title: 'Adjust', description: 'Apply a correction.' }
  ] } });
  assert.ok(loop.panels[0].elements.some(element => element.id === 'loop-core'));
  assert.equal(loop.panels[0].elements.filter(element => element.type === 'arrow').length, 3);
  assert.deepEqual(inspectScene(loop).issues, []);
  const tree = composeInfographic({ ...base, title: 'Classification', description: 'A synthetic tree.', structure: { type: 'tree', root: { id: 'root', title: 'Root' }, children: [
    { id: 'left', title: 'Left branch' }, { id: 'right', title: 'Right branch' }
  ] } });
  assert.ok(tree.panels[0].elements.some(element => element.id === 'tree-trunk'));
  assert.equal(tree.panels[0].elements.filter(element => element.type === 'arrow').length, 2);
  assert.deepEqual(inspectScene(tree).issues, []);
  const neighborhood = composeInfographic({ ...base, title: 'Local context', description: 'A synthetic neighborhood.', structure: { type: 'neighborhood', focus: { id: 'focus', title: 'Focal node' }, neighbors: [
    { id: 'one', title: 'One', context: 'Provides input' }, { id: 'two', title: 'Two', context: 'Receives output' }
  ] } });
  assert.equal(neighborhood.panels[0].elements.filter(element => element.type === 'line').filter(element => element.id.startsWith('focus-to-')).length, 2);
  assert.deepEqual(inspectScene(neighborhood).issues, []);
  const bars = composeInfographic({ ...base, title: 'Measured values', description: 'A synthetic bar chart.', structure: { type: 'bar-chart', yAxis: 'Score', unit: '%', items: [
    { id: 'a', label: 'A', value: 20 }, { id: 'b', label: 'B', value: 80 }
  ] } });
  assert.equal(bars.panels[0].elements.filter(element => element.id.endsWith('-bar')).length, 2);
  assert.deepEqual(inspectScene(bars).issues, []);
});
