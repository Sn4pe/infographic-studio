import { createComponent } from './components.js';
import { layoutText } from './text.js';
import { assertScene, inspectScene } from './validate.js';
import { routeConnections } from './routing.js';
import { assertDocument } from './document-schema.js';

const identifier = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
function fields(value, allowed, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new Error(`Invalid ${name} fields.`);
}
function requiredText(value, name) { if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} needs nonempty text.`); }
function number(value, min, max, name) { if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${name} must be between ${min} and ${max}.`); return value; }
function text(id, value, x, y, width, size, weight = 'regular') {
  requiredText(value, id);
  const measured = layoutText(value, width, size, weight);
  if (measured.widths.some(w => w > width + .1)) throw new Error(`${id}: a word exceeds ${Math.floor(width)} px. Use fewer columns, a wider canvas or an explicit line break; text was not reduced.`);
  return { element: { id, type: 'text', text: value, x, y, width, fontSize: size, weight, fill: '$ink' }, height: measured.height };
}

/** Compile semantic illustrated objects to ordinary editable scene primitives. */
export function composeDocument(document) {
  assertDocument(document);
  fields(document, ['title','description','width','height','fontSize','theme','palette','sources','sections'], 'document');
  requiredText(document.title, 'Document title'); requiredText(document.description, 'Document description');
  const width = number(document.width ?? 1600, 600, 4096, 'Document width');
  if (!Number.isInteger(width)) throw new Error('Document width must be an integer.');
  const fontSize = number(document.fontSize ?? 26, 16, 48, 'Font size');
  if (!Array.isArray(document.sections) || !document.sections.length || document.sections.length > 24) throw new Error('Document needs 1–24 sections.');
  const panelWidth = width - 104, padding = 24, gap = 48, ids = new Set();
  const reserve = id => { if (!identifier.test(id ?? '') || ids.has(id)) throw new Error(`Invalid or duplicate semantic ID: ${id}.`); ids.add(id); };
  const panels = [];
  let panelY = Math.ceil(50 + layoutText(document.title, width - 104, 42, 'semibold').height + 24);
  for (const section of document.sections) {
    fields(section, ['id','title','description','layout','columns','items','relations'], 'section');
    reserve(section.id); requiredText(section.title, `Section ${section.id} title`);
    if (!Array.isArray(section.items) || !section.items.length || section.items.length > 16) throw new Error(`${section.id}: use 1–16 objects per section.`);
    const mode = section.layout ?? 'grid';
    if (!['row','column','grid','cycle'].includes(mode)) throw new Error(`Unknown layout: ${mode}.`);
    if (mode === 'cycle' && section.items.length !== 4) throw new Error('Cycle layout currently requires exactly four objects; relationships remain explicit.');
    if (section.columns !== undefined && mode !== 'grid') throw new Error('columns applies only to grid layout.');
    const columns = mode === 'row' ? section.items.length : mode === 'column' ? 1 : mode === 'cycle' ? 2 : section.columns ?? Math.min(3, section.items.length);
    if (!Number.isInteger(columns) || columns < 1 || columns > section.items.length) throw new Error(`${section.id}: invalid columns.`);
    const hasEdges = (section.relations?.length ?? 0) > 0;
    // Corridors on all sides allow routes around non-endpoint objects.
    const inset = padding + (hasEdges ? 28 : 0);
    const unitWidth = (panelWidth - 2 * inset - gap * (columns - 1)) / columns;
    if (unitWidth < 200) throw new Error(`${section.id}: too many columns; illustrated objects need at least 200 px each.`);
    const heading = text(`${section.id}-heading`, section.title, padding, padding, panelWidth - 2 * padding, fontSize + 8, 'semibold');
    const elements = [heading.element];
    let bodyY = padding + heading.height + 20;
    if (section.description !== undefined) {
      const description = text(`${section.id}-description`, section.description, padding, bodyY, panelWidth - 2 * padding, fontSize);
      elements.push(description.element); bodyY += description.height + 20;
    }
    bodyY += hasEdges ? 28 : 0;
    const objects = section.items.map(item => {
      fields(item, ['id','component','variant','title','description'], 'object');
      reserve(item.id);
      const artSize = 72, inlineWidth = unitWidth - artSize - 20;
      const inline = layoutText(item.title, inlineWidth, fontSize + 2, 'semibold');
      const stacked = inline.widths.some(w=>w>inlineWidth+.1) || inline.height > artSize * 1.5;
      const labelWidth = stacked ? unitWidth : inlineWidth;
      // Measure first. Nothing is truncated, shrunk or removed to fit.
      const title = text(`${item.id}-title`, item.title, 0, 0, labelWidth, fontSize + 2, 'semibold');
      const description = item.description === undefined ? null : text(`${item.id}-description`, item.description, 0, 0, unitWidth, fontSize);
      const topHeight = stacked ? artSize + 14 + title.height : Math.max(artSize, title.height);
      return { item, title, description, stacked, topHeight, height: topHeight + (description ? 14 + description.height : 0) };
    });
    const rowHeights = [];
    objects.forEach((o, i) => { const row = Math.floor(i / columns); rowHeights[row] = Math.max(rowHeights[row] ?? 0, o.height); });
    const bounds = [];
    objects.forEach((o, i) => {
      const row = Math.floor(i / columns), col = mode === 'cycle' && row === 1 ? columns - 1 - i % columns : i % columns;
      const x = inset + col * (unitWidth + gap), y = bodyY + rowHeights.slice(0, row).reduce((a,b) => a+b+gap, 0);
      bounds.push({ id: o.item.id, x, y, width: unitWidth, height: rowHeights[row] });
      elements.push(...createComponent(o.item.component, { id: `${o.item.id}-art`, x, y, width: 72, height: 72, variant: o.item.variant ?? 'teal' }));
      elements.push({ ...o.title.element, x: x + (o.stacked ? 0 : 92), y: y + (o.stacked ? 86 : (o.topHeight - o.title.height) / 2) });
      if (o.description) elements.push({ ...o.description.element, x, y: y + o.topHeight + 14 });
    });
    const height = Math.ceil(bodyY + rowHeights.reduce((a,b) => a+b, 0) + gap * (rowHeights.length - 1) + inset);
    const relations = section.relations ?? [];
    if (!Array.isArray(relations) || relations.length > 32) throw new Error(`${section.id}: use at most 32 relations.`);
    for (const edge of relations) {
      fields(edge, ['id','from','to'], 'relation'); reserve(edge.id);
      if (edge.from === edge.to) throw new Error(`${edge.id}: self-relations need a dedicated free-placement explanation.`);
      if (![edge.from,edge.to].every(id => bounds.some(b => b.id === id))) throw new Error(`${edge.id}: relationship endpoints must name objects in the same section.`);
    }
    const routes = routeConnections(bounds, relations, { x: padding, y: bodyY - 28, width: panelWidth - 2*padding, height: height - padding - (bodyY - 28) });
    elements.unshift(...routes);
    panels.push({ id: section.id, x: 52, y: panelY, width: panelWidth, height, framed: false, elements });
    panelY += height + 32;
  }
  const requiredHeight = Math.ceil(panelY - 32 + 60);
  const height = document.height === undefined ? Math.max(300, requiredHeight) : number(document.height, 300, 4096, 'Document height');
  if (height < requiredHeight || requiredHeight > 4096) throw new Error(`Document needs ${requiredHeight} px height at ${width} px width and ${fontSize} px body text; available height is ${height}. Increase height (up to 4096), adjust columns, shorten wording without removing claims, or split the figure. Text was not reduced.`);
  const scene = { version: 1, title: document.title, description: document.description, width, height, theme: document.theme ?? 'paper', ...(document.palette ? { palette: document.palette } : {}), sources: document.sources ?? [], panels };
  assertScene(scene);
  const check = inspectScene(scene);
  if (!check.ok) throw new Error(`Composed document failed validation: ${check.issues.filter(i=>i.severity==='error').map(i=>`${i.element}: ${i.message}`).join('; ')}`);
  return scene;
}
