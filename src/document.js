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
  const panelWidth = width - 104, padding = 24, ids = new Set();
  const reserve = id => { if (!identifier.test(id ?? '') || ids.has(id)) throw new Error(`Invalid or duplicate semantic ID: ${id}.`); ids.add(id); };
  const panels = [];
  let panelY = Math.ceil(50 + layoutText(document.title, width - 104, 42, 'semibold').height + 24);
  for (const section of document.sections) {
    fields(section, ['id','title','description','layout','columns','groups','items','relations','journey'], 'section');
    reserve(section.id); requiredText(section.title, `Section ${section.id} title`);
    if (!Array.isArray(section.items) || !section.items.length || section.items.length > 16) throw new Error(`${section.id}: use 1–16 objects per section.`);
    const requestedMode = section.layout ?? 'grid';
    if (!['row','column','grid','cycle','pipeline','architecture','architecture-overview'].includes(requestedMode)) throw new Error(`Unknown layout: ${requestedMode}.`);
    const overview = requestedMode === 'architecture-overview';
    const mode = overview ? 'architecture' : requestedMode;
    if (mode === 'cycle' && section.items.length !== 4) throw new Error('Cycle layout currently requires exactly four objects; relationships remain explicit.');
    if (mode === 'pipeline' && (section.items.length < 2 || section.items.length > 5)) throw new Error('Pipeline layout needs 2–5 stages. Split a longer process into figures.');
    if (section.columns !== undefined && !['grid','architecture'].includes(mode)) throw new Error('columns applies only to grid and architecture layouts.');
    const allRelations = section.relations ?? [];
    if (!Array.isArray(allRelations) || allRelations.length > 32) throw new Error(`${section.id}: use at most 32 relations.`);
    let relations = allRelations;
    if (overview) {
      if (!Array.isArray(section.journey) || section.journey.length < 2) throw new Error(`${section.id}: architecture-overview needs a journey of at least two relation IDs.`);
      const byId = new Map(allRelations.map(relation => [relation.id, relation]));
      relations = section.journey.map(id => {
        const relation = byId.get(id);
        if (!relation) throw new Error(`${section.id}: journey references unknown relation ${id}.`);
        return relation;
      });
      for (let index = 1; index < relations.length; index++) {
        if (relations[index - 1].to !== relations[index].from) throw new Error(`${section.id}: journey must be one continuous directed path; ${relations[index - 1].id} does not lead to ${relations[index].id}.`);
      }
    } else if (section.journey !== undefined) throw new Error('journey is only supported by architecture-overview.');
    const groupIds = new Set();
    const itemById = new Map(section.items.map(item => [item.id, item]));
    let groups = [];
    let arrangedItems = section.items;
    let positions;
    if (mode === 'architecture') {
      if (!Array.isArray(section.groups) || section.groups.length < 2 || section.groups.length > 4) throw new Error('Architecture layout needs 2–4 ordered groups.');
      const usedItems = new Set();
      for (const group of section.groups) {
        fields(group, ['id','title','items'], 'architecture group');
        if (!identifier.test(group.id ?? '') || groupIds.has(group.id) || itemById.has(group.id)) throw new Error(`Invalid or duplicate architecture group: ${group.id}.`);
        groupIds.add(group.id); requiredText(group.title, `Architecture group ${group.id} title`);
        if (!Array.isArray(group.items) || !group.items.length) throw new Error(`Architecture group ${group.id} needs items.`);
        for (const itemId of group.items) {
          if (!itemById.has(itemId) || usedItems.has(itemId)) throw new Error(`Architecture group ${group.id} must contain each known item once.`);
          usedItems.add(itemId);
        }
      }
      if (usedItems.size !== section.items.length) throw new Error('Architecture groups must contain every section item exactly once.');
      groups = section.groups;
      arrangedItems = groups.flatMap(group => group.items.map(itemId => itemById.get(itemId)));
      const architectureColumns = section.columns ?? Math.max(...groups.map(group => group.items.length));
      positions = groups.flatMap((group, row) => group.items.map((_, col) => ({ row, col: (architectureColumns - group.items.length) / 2 + col })));
    } else if (section.groups !== undefined) throw new Error('groups are only supported by architecture layout.');
    const columns = mode === 'row' || mode === 'pipeline' ? section.items.length : mode === 'column' ? 1 : mode === 'cycle' ? 2 : mode === 'architecture' ? section.columns ?? Math.max(...groups.map(group => group.items.length)) : section.columns ?? Math.min(3, section.items.length);
    if (!Number.isInteger(columns) || columns < 1 || columns > section.items.length) throw new Error(`${section.id}: invalid columns.`);
    if (mode === 'architecture' && groups.some(group => group.items.length > columns)) throw new Error(`${section.id}: architecture columns cannot be smaller than the largest group.`);
    const hasEdges = relations.length > 0;
    const relationLabels = relations.filter(relation => relation.label);
    const hasRelationLabels = relationLabels.length > 0;
    const gap = hasRelationLabels ? 120 : mode === 'pipeline' ? 64 : 48;
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
    if (relationLabels.length) {
      const summary = relationLabels.map(relation => `${relation.from} → ${relation.to}: ${relation.label}`).join('  ·  ');
      const legend = text(`${section.id}-relations`, summary, padding, bodyY, panelWidth - 2 * padding, fontSize, 'semibold');
      elements.push({ ...legend.element, fill: '$secondary' }); bodyY += legend.height + 16;
    }
    bodyY += hasEdges ? 28 : 0;
    if (!positions) positions = arrangedItems.map((_, i) => ({ row: Math.floor(i / columns), col: mode === 'cycle' && Math.floor(i / columns) === 1 ? columns - 1 - i % columns : i % columns }));
    const objects = arrangedItems.map(item => {
      fields(item, ['id','component','variant','title','description'], 'object');
      reserve(item.id);
      // Architecture is a semantic card layout: its padding, artwork and text
      // area are calculated before any primitive is emitted.  This keeps long
      // labels inside cards without per-diagram coordinate adjustments.
      const cardInset = mode === 'architecture' ? 18 : 0;
      const contentWidth = unitWidth - cardInset * 2;
      const artSize = mode === 'pipeline' ? 96 : mode === 'architecture' ? 84 : 72;
      const inlineWidth = contentWidth - artSize - 20;
      const inline = layoutText(item.title, inlineWidth, fontSize + 2, 'semibold');
      const stacked = inline.widths.some(w=>w>inlineWidth+.1) || inline.height > artSize * 1.5;
      const labelWidth = stacked ? contentWidth : inlineWidth;
      // Measure first. Nothing is truncated, shrunk or removed to fit.
      const title = text(`${item.id}-title`, item.title, 0, 0, labelWidth, fontSize + 2, 'semibold');
      const description = item.description === undefined ? null : text(`${item.id}-description`, item.description, 0, 0, contentWidth, fontSize);
      const topHeight = stacked ? artSize + 14 + title.height : Math.max(artSize, title.height);
      const contentHeight = topHeight + (description ? 14 + description.height : 0);
      return { item, title, description, stacked, topHeight, artSize, cardInset, contentWidth, height: contentHeight + cardInset * 2 };
    });
    const rowHeights = Array.from({ length: Math.max(...positions.map(position => position.row)) + 1 }, () => 0);
    objects.forEach((o, i) => { rowHeights[positions[i].row] = Math.max(rowHeights[positions[i].row], o.height); });
    const groupHeadings = mode === 'architecture' ? groups.map(group => text(`${group.id}-heading`, group.title, 0, 0, panelWidth - 2 * padding, fontSize, 'semibold')) : [];
    const groupHeaderHeights = mode === 'architecture' ? groupHeadings.map(heading => heading.height + 14) : rowHeights.map(() => 0);
    const rowY = row => bodyY + rowHeights.slice(0, row).reduce((total, rowHeight, index) => total + rowHeight + groupHeaderHeights[index] + gap, 0) + groupHeaderHeights[row];
    const rowTop = row => rowY(row) - groupHeaderHeights[row];
    const bounds = [];
    const groupBackgrounds = [];
    const cardBackgrounds = [];
    objects.forEach((o, i) => {
      const { row, col } = positions[i];
      const x = inset + col * (unitWidth + gap), y = rowY(row);
      bounds.push({ id: o.item.id, x, y, width: unitWidth, height: rowHeights[row], row });
      const cardId = `${o.item.id}-card`;
      if (mode === 'architecture') cardBackgrounds.push({ id: cardId, type: 'rect', x, y, width: unitWidth, height: rowHeights[row], rx: 10, fill: '$background', stroke: '$line' });
      const contentX = x + o.cardInset, contentY = y + o.cardInset;
      elements.push(...createComponent(o.item.component, { id: `${o.item.id}-art`, x: contentX, y: contentY, width: o.artSize, height: o.artSize, variant: o.item.variant ?? 'teal' }));
      elements.push({ ...o.title.element, x: contentX + (o.stacked ? 0 : o.artSize + 20), y: contentY + (o.stacked ? o.artSize + 14 : (o.topHeight - o.title.height) / 2), ...(mode === 'architecture' ? { container: cardId } : {}) });
      if (o.description) elements.push({ ...o.description.element, x: contentX, y: contentY + o.topHeight + 14, ...(mode === 'architecture' ? { container: cardId } : {}) });
    });
    if (mode === 'architecture') {
      groups.forEach((group, row) => {
        const bandY = rowTop(row), bandHeight = groupHeaderHeights[row] + rowHeights[row] + 20;
        groupBackgrounds.push({ id: `${group.id}-band`, type: 'rect', x: padding, y: bandY, width: panelWidth - 2 * padding, height: bandHeight, rx: 12, fill: '$panel', stroke: '$line' });
        elements.push({ ...groupHeadings[row].element, x: padding + 18, y: bandY + 8, width: panelWidth - 2 * padding - 36, fill: '$secondary' });
        const headingWidth = Math.max(...layoutText(group.title, panelWidth - 2 * padding - 36, fontSize, 'semibold').widths) + 36;
        bounds.push({ id: `${group.id}-heading-obstacle`, x: padding + 18, y: bandY, width: headingWidth, height: groupHeaderHeights[row] });
      });
    }
    const height = Math.ceil(bodyY + rowHeights.reduce((total, rowHeight, row) => total + rowHeight + groupHeaderHeights[row], 0) + gap * (rowHeights.length - 1) + inset);
    for (const edge of allRelations) {
      fields(edge, ['id','from','to','label'], 'relation'); reserve(edge.id);
      if (edge.from === edge.to) throw new Error(`${edge.id}: self-relations need a dedicated free-placement explanation.`);
      if (![edge.from,edge.to].every(id => bounds.some(b => b.id === id))) throw new Error(`${edge.id}: relationship endpoints must name objects in the same section.`);
    }
    const architectureRelations = mode === 'architecture' ? relations.map(relation => ({ relation, source: bounds.find(bound => bound.id === relation.from), target: bounds.find(bound => bound.id === relation.to) })) : [];
    for (const { relation, source, target } of architectureRelations) {
      if (target.row < source.row) throw new Error(`${relation.id}: architecture relationships must run within a layer or downward through the listed layers.`);
      if (target.row > source.row + 1) throw new Error(`${relation.id}: architecture relationships can connect only adjacent layers. Add an explicit hand-off object or split the topology.`);
      if (target.row === source.row && target.x <= source.x) throw new Error(`${relation.id}: same-layer architecture relationships must run left to right.`);
    }
    const routes = mode === 'architecture'
      ? architectureRelations.flatMap(({ relation, source, target }) => {
          if (target.row === source.row) {
            const intermediate = bounds.some(bound => bound.row === source.row && bound.id !== source.id && bound.id !== target.id && bound.x >= source.x + source.width && bound.x + bound.width <= target.x);
            if (!intermediate) {
              const y = source.y + source.height / 2;
              return [{ id: `${relation.id}-segment-1`, type: 'arrow', x: source.x + source.width, y, x2: target.x, y2: y, stroke: '$secondary', strokeWidth: 3 }];
            }
            // A same-layer shortcut that skips a card would pass through that
            // card's artwork. Route through the measured bottom padding of the
            // group instead; the lane exists for every architecture row.
            const startX = source.x + source.width / 2, startY = source.y + source.height;
            const endX = target.x + target.width / 2, endY = target.y + target.height;
            const laneY = startY + 10;
            const segments = [
              { x: startX, y: startY, x2: startX, y2: laneY },
              { x: startX, y: laneY, x2: endX, y2: laneY },
              { x: endX, y: laneY, x2: endX, y2: endY }
            ].filter(segment => segment.x !== segment.x2 || segment.y !== segment.y2);
            return segments.map((segment, index) => ({ id: `${relation.id}-segment-${index + 1}`, type: index === segments.length - 1 ? 'arrow' : 'line', ...segment, stroke: '$secondary', strokeWidth: 3 }));
          }
          const startX = source.x + source.width / 2, startY = source.y + source.height;
          const endX = target.x + target.width / 2, endY = target.y;
          const peers = architectureRelations.filter(other => other.source.row === source.row && other.target.row === target.row);
          const laneIndex = peers.findIndex(other => other.relation.id === relation.id);
          const corridorStart = rowTop(target.row) - gap + 26;
          const corridorSpan = Math.max(0, gap - 32);
          const laneY = peers.length === 1 ? corridorStart + corridorSpan / 2 : corridorStart + corridorSpan * laneIndex / (peers.length - 1);
          const segments = [
            { x: startX, y: startY, x2: startX, y2: laneY },
            { x: startX, y: laneY, x2: endX, y2: laneY },
            { x: endX, y: laneY, x2: endX, y2: endY }
          ].filter(segment => segment.x !== segment.x2 || segment.y !== segment.y2);
          return segments.map((segment, index) => ({ id: `${relation.id}-segment-${index + 1}`, type: index === segments.length - 1 ? 'arrow' : 'line', ...segment, stroke: '$secondary', strokeWidth: 3 }));
        })
      : routeConnections(bounds, relations, { x: padding, y: bodyY - 28, width: panelWidth - 2*padding, height: height - padding - (bodyY - 28) });
    elements.unshift(...groupBackgrounds, ...cardBackgrounds, ...routes);
    panels.push({ id: section.id, x: 52, y: panelY, width: panelWidth, height, framed: false, elements });
    panelY += height + 32;
  }
  const requiredHeight = Math.ceil(panelY - 32 + 60);
  const height = document.height === undefined ? Math.max(300, requiredHeight) : number(document.height, 300, 4096, 'Document height');
  if (height < requiredHeight || requiredHeight > 4096) throw new Error(`Document needs ${requiredHeight} px height at ${width} px width and ${fontSize} px body text; available height is ${height}. Increase height (up to 4096), adjust columns, shorten wording without removing claims, or split the figure. Text was not reduced.`);
  const scene = { version: 1, title: document.title, description: document.description, width, height, theme: document.theme ?? 'blueprint', ...(document.palette ? { palette: document.palette } : {}), sources: document.sources ?? [], panels };
  assertScene(scene);
  const check = inspectScene(scene);
  if (!check.ok) throw new Error(`Composed document failed validation: ${check.issues.filter(i=>i.severity==='error').map(i=>`${i.element}: ${i.message}`).join('; ')}`);
  return scene;
}
