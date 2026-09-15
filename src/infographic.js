import { composeDocument } from './document.js';
import { assertScene, inspectScene } from './validate.js';
import { assertInfographic } from './infographic-schema.js';
import { layoutText } from './text.js';

const identifier = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const structureCatalog = [
  { type: 'sequence', title: 'Sequence', use: 'Ordered stages where the progression is the message.', limit: '2–5 illustrated stages' },
  { type: 'timeline', title: 'Timeline', use: 'Dated or ordered events whose chronology is the message.', limit: '2–8 events' },
  { type: 'feedback-loop', title: 'Feedback loop', use: 'A repeating causal process where the return path is the message.', limit: '3–6 stages' },
  { type: 'relationship', title: 'Layered relationship', use: 'A bounded system with explicit layers and downward links.', limit: '2–4 layers, 2–16 nodes' },
  { type: 'neighborhood', title: 'Relationship neighborhood', use: 'One focal entity and its immediately relevant context.', limit: '1 focus, 2–6 neighbors' },
  { type: 'hierarchy', title: 'Hierarchy', use: 'A hierarchy represented as ordered levels and downward links.', limit: '2–4 levels, 2–16 nodes' },
  { type: 'tree', title: 'Tree', use: 'One root and a bounded first level of children.', limit: '1 root, 2–6 children' },
  { type: 'architecture-overview', title: 'Architecture overview', use: 'A complete layered system explained through one declared journey.', limit: '2–4 layers, 2–16 nodes, 2–8 journey links' },
  { type: 'matrix', title: 'Decision matrix', use: 'Four positions explained through two meaningful axes.', limit: '2 axes, 4 quadrants' },
  { type: 'bar-chart', title: 'Bar chart', use: 'A small set of comparable non-negative values.', limit: '2–8 values' },
  { type: 'comparison', title: 'Comparison', use: 'Two alternatives, mechanisms or states given equal visual weight.', limit: '2 sides, 1–6 items each' }
];
export const listInfographicStructures = () => structuredClone(structureCatalog);
const text = (id, value, x, y, width, fontSize, weight = 'regular', container) => {
  const layout = layoutText(value, width, fontSize, weight);
  if (layout.widths.some(line => line > width + 0.1)) throw new Error(`${id}: a word exceeds its text box.`);
  return { element: { id, type: 'text', text: value, x, y, width, fontSize, weight, fill: '$ink', ...(container ? { container } : {}) }, height: layout.height };
};

function documentBase(infographic) {
  return {
    title: infographic.title,
    description: infographic.description,
    ...(infographic.width ? { width: infographic.width } : {}),
    ...(infographic.height ? { height: infographic.height } : {}),
    ...(infographic.fontSize ? { fontSize: infographic.fontSize } : {}),
    ...(infographic.theme ? { theme: infographic.theme } : {}),
    ...(infographic.palette ? { palette: infographic.palette } : {}),
    ...(infographic.sources ? { sources: infographic.sources } : {})
  };
}

function composeSequence(infographic, structure) {
  const relations = structure.relations ?? structure.items.slice(0, -1).map((item, index) => ({ id: `${item.id}-to-${structure.items[index + 1].id}`, from: item.id, to: structure.items[index + 1].id }));
  return composeDocument({ ...documentBase(infographic), sections: [{
    id: 'sequence', title: structure.title ?? infographic.title, ...(structure.description ? { description: structure.description } : {}), layout: 'pipeline', items: structure.items, relations
  }] });
}

function composeLayered(infographic, structure) {
  return composeDocument({ ...documentBase(infographic), sections: [{
    id: structure.type, title: structure.title ?? infographic.title, ...(structure.description ? { description: structure.description } : {}), layout: structure.type === 'architecture-overview' ? 'architecture-overview' : 'architecture', ...(structure.columns ? { columns: structure.columns } : {}), groups: structure.groups, items: structure.items, relations: structure.relations ?? [], ...(structure.type === 'architecture-overview' ? { journey: structure.journey } : {})
  }] });
}

function composedScene(infographic, panel, height, subtitle = infographic.description) {
  const scene = {
    version: 1, title: infographic.title, description: infographic.description, subtitle,
    width: infographic.width ?? 1600, height,
    ...(infographic.theme ? { theme: infographic.theme } : {}),
    ...(infographic.palette ? { palette: infographic.palette } : {}),
    ...(infographic.sources ? { sources: infographic.sources } : {}), panels: [panel]
  };
  assertScene(scene);
  const report = inspectScene(scene);
  if (!report.ok) throw new Error(`Composed infographic failed validation: ${report.issues.filter(issue => issue.severity === 'error').map(issue => issue.message).join('; ')}`);
  return scene;
}

function composeTimeline(infographic, structure) {
  const width = infographic.width ?? 1600, fontSize = infographic.fontSize ?? 24, panelWidth = width - 104;
  const subtitle = structure.description ?? infographic.description;
  const titleHeight = layoutText(infographic.title, panelWidth, 42, 'semibold').height;
  const subtitleHeight = layoutText(subtitle, panelWidth, 20, 'regular').height;
  const panelY = Math.ceil(50 + titleHeight + 8 + subtitleHeight + 24);
  const spineX = panelWidth / 2, cardWidth = (panelWidth - 156) / 2;
  const events = structure.items.map((item, index) => {
    const title = text(`${item.id}-title`, item.title, 0, 0, cardWidth - 48, fontSize + 2, 'semibold');
    const date = item.date ? text(`${item.id}-date`, item.date, 0, 0, cardWidth - 48, fontSize - 4, 'semibold') : null;
    const description = item.description ? text(`${item.id}-description`, item.description, 0, 0, cardWidth - 48, fontSize) : null;
    return { item, index, title, date, description, height: 28 + (date ? date.height + 8 : 0) + title.height + (description ? 12 + description.height : 0) + 28 };
  });
  let y = 32;
  const positioned = events.map(event => {
    const positionedEvent = { ...event, y, x: event.index % 2 ? spineX + 52 : spineX - 52 - cardWidth };
    y += event.height + 42;
    return positionedEvent;
  });
  const panelHeight = y - 10;
  const requiredHeight = Math.ceil(panelY + panelHeight + 60);
  const height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Timeline needs ${requiredHeight} px height; increase the canvas or split the events.`);
  const elements = [{ id: 'timeline-spine', type: 'line', x: spineX, y: positioned[0].y + 22, x2: spineX, y2: positioned.at(-1).y + positioned.at(-1).height - 22, stroke: '$line', strokeWidth: 3 }];
  for (const event of positioned) {
    const dotY = event.y + event.height / 2;
    const edgeX = event.index % 2 ? event.x : event.x + cardWidth;
    elements.push(
      { id: `${event.item.id}-leader`, type: 'line', x: spineX, y: dotY, x2: edgeX, y2: dotY, stroke: '$secondary', strokeWidth: 3 },
      { id: `${event.item.id}-dot`, type: 'ellipse', x: spineX, y: dotY, rx: 10, ry: 10, fill: '$accent', stroke: '$background', strokeWidth: 3 },
      { id: `${event.item.id}-card`, type: 'rect', x: event.x, y: event.y, width: cardWidth, height: event.height, rx: 12, fill: '$panel', stroke: '$line', strokeWidth: 2 }
    );
    let contentY = event.y + 24;
    if (event.date) { elements.push({ ...event.date.element, x: event.x + 24, y: contentY, fill: '$secondary', container: `${event.item.id}-card` }); contentY += event.date.height + 8; }
    elements.push({ ...event.title.element, x: event.x + 24, y: contentY, container: `${event.item.id}-card` }); contentY += event.title.height;
    if (event.description) elements.push({ ...event.description.element, x: event.x + 24, y: contentY + 12, fill: '$muted', container: `${event.item.id}-card` });
  }
  return composedScene(infographic, { id: 'timeline', x: 52, y: panelY, width: panelWidth, height: panelHeight, framed: false, elements }, height, subtitle);
}

function composeMatrix(infographic, structure) {
  const width = infographic.width ?? 1600, fontSize = infographic.fontSize ?? 24, panelWidth = width - 104;
  const subtitle = structure.description ?? infographic.description;
  const titleHeight = layoutText(infographic.title, panelWidth, 42, 'semibold').height;
  const subtitleHeight = layoutText(subtitle, panelWidth, 20, 'regular').height;
  const panelY = Math.ceil(50 + titleHeight + 8 + subtitleHeight + 24);
  const cardWidth = (panelWidth - 132) / 2;
  const quadrants = structure.quadrants.map((quadrant, index) => {
    const title = text(`${quadrant.id}-title`, quadrant.title, 0, 0, cardWidth - 48, fontSize + 2, 'semibold');
    const description = quadrant.description ? text(`${quadrant.id}-description`, quadrant.description, 0, 0, cardWidth - 48, fontSize) : null;
    return { quadrant, index, title, description, height: 28 + title.height + (description ? 12 + description.height : 0) + 28 };
  });
  const rowHeights = [Math.max(quadrants[0].height, quadrants[1].height), Math.max(quadrants[2].height, quadrants[3].height)];
  const top = 58, lane = 54, panelHeight = top + rowHeights[0] + lane + rowHeights[1] + 72;
  const requiredHeight = Math.ceil(panelY + panelHeight + 60);
  const height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Decision matrix needs ${requiredHeight} px height; increase the canvas or shorten the quadrant text.`);
  const axisX = panelWidth / 2, axisY = top + rowHeights[0] + lane / 2;
  const elements = [
    { id: 'matrix-horizontal-axis', type: 'line', x: 28, y: axisY, x2: panelWidth - 28, y2: axisY, stroke: '$secondary', strokeWidth: 3 },
    { id: 'matrix-vertical-axis', type: 'line', x: axisX, y: 26, x2: axisX, y2: panelHeight - 34, stroke: '$secondary', strokeWidth: 3 },
    { id: 'matrix-y-axis', type: 'text', text: structure.yAxis, x: 32, y: 8, width: axisX - 72, fontSize: fontSize - 4, weight: 'semibold', fill: '$secondary' },
    { id: 'matrix-x-axis', type: 'text', text: structure.xAxis, x: axisX + 34, y: panelHeight - 48, width: axisX - 70, fontSize: fontSize - 4, weight: 'semibold', fill: '$secondary', align: 'right' }
  ];
  for (const entry of quadrants) {
    const row = Math.floor(entry.index / 2), col = entry.index % 2;
    const x = col ? axisX + 38 : 28;
    const y = row ? axisY + lane / 2 + 2 : top;
    const cardHeight = rowHeights[row];
    const cardId = `${entry.quadrant.id}-card`;
    elements.push({ id: cardId, type: 'rect', x, y, width: cardWidth, height: cardHeight, rx: 12, fill: '$panel', stroke: '$line', strokeWidth: 2 });
    elements.push({ ...entry.title.element, x: x + 24, y: y + 24, container: cardId });
    if (entry.description) elements.push({ ...entry.description.element, x: x + 24, y: y + 24 + entry.title.height + 12, fill: '$muted', container: cardId });
  }
  return composedScene(infographic, { id: 'matrix', x: 52, y: panelY, width: panelWidth, height: panelHeight, framed: false, elements }, height, subtitle);
}

function sceneHeader(infographic, structure) {
  const width = infographic.width ?? 1600, panelWidth = width - 104;
  const subtitle = structure.description ?? infographic.description;
  const titleHeight = layoutText(infographic.title, panelWidth, 42, 'semibold').height;
  const subtitleHeight = layoutText(subtitle, panelWidth, 20, 'regular').height;
  return { width, panelWidth, subtitle, panelY: Math.ceil(50 + titleHeight + 8 + subtitleHeight + 24), fontSize: infographic.fontSize ?? 24 };
}

function edgePoint(box, towardX, towardY) {
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const dx = towardX - cx, dy = towardY - cy;
  const factor = 1 / Math.max(Math.abs(dx) / (box.width / 2), Math.abs(dy) / (box.height / 2));
  return { x: cx + dx * factor, y: cy + dy * factor };
}

function nodeCard(item, id, width, fontSize) {
  const title = text(`${id}-title`, item.title, 0, 0, width - 48, fontSize + 2, 'semibold');
  const context = item.context ? text(`${id}-context`, item.context, 0, 0, width - 48, fontSize - 4, 'semibold') : null;
  const description = item.description ? text(`${id}-description`, item.description, 0, 0, width - 48, fontSize) : null;
  return { item, id, title, context, description, height: 28 + (context ? context.height + 8 : 0) + title.height + (description ? 12 + description.height : 0) + 28 };
}

function drawNodeCard(node, x, y, width) {
  const cardId = `${node.id}-card`, elements = [{ id: cardId, type: 'rect', x, y, width, height: node.height, rx: 12, fill: '$panel', stroke: '$line', strokeWidth: 2 }];
  let contentY = y + 24;
  if (node.context) { elements.push({ ...node.context.element, x: x + 24, y: contentY, fill: '$secondary', container: cardId }); contentY += node.context.height + 8; }
  elements.push({ ...node.title.element, x: x + 24, y: contentY, container: cardId }); contentY += node.title.height;
  if (node.description) elements.push({ ...node.description.element, x: x + 24, y: contentY + 12, fill: '$muted', container: cardId });
  return elements;
}

function composeFeedbackLoop(infographic, structure) {
  const { panelWidth, subtitle, panelY, fontSize } = sceneHeader(infographic, structure);
  const cardWidth = 260, centerX = panelWidth / 2, centerY = 470, radiusX = 480, radiusY = 290;
  const nodes = structure.items.map(item => nodeCard(item, item.id, cardWidth, fontSize));
  const placed = nodes.map((node, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / nodes.length;
    return { ...node, x: centerX + radiusX * Math.cos(angle) - cardWidth / 2, y: centerY + radiusY * Math.sin(angle) - node.height / 2, width: cardWidth };
  });
  const panelHeight = Math.ceil(Math.max(...placed.map(node => node.y + node.height)) + 48);
  const requiredHeight = panelY + panelHeight + 60, height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Feedback loop needs ${requiredHeight} px height; shorten stages or split the loop.`);
  const elements = [];
  for (let index = 0; index < placed.length; index++) {
    const from = placed[index], to = placed[(index + 1) % placed.length];
    const targetCenterX = to.x + to.width / 2, targetCenterY = to.y + to.height / 2;
    const sourceCenterX = from.x + from.width / 2, sourceCenterY = from.y + from.height / 2;
    const start = edgePoint(from, targetCenterX, targetCenterY), end = edgePoint(to, sourceCenterX, sourceCenterY);
    elements.push({ id: `${from.id}-to-${to.id}`, type: 'arrow', x: start.x, y: start.y, x2: end.x, y2: end.y, stroke: '$accent', strokeWidth: 3 });
  }
  elements.push({ id: 'loop-core', type: 'ellipse', x: centerX, y: centerY, rx: 118, ry: 58, fill: '$background', stroke: '$secondary', strokeWidth: 2 });
  elements.push({ id: 'loop-core-label', type: 'text', text: 'Feedback', x: centerX - 94, y: centerY - 16, width: 188, fontSize: fontSize + 2, weight: 'semibold', fill: '$secondary', align: 'center' });
  for (const node of placed) elements.push(...drawNodeCard(node, node.x, node.y, node.width));
  return composedScene(infographic, { id: 'feedback-loop', x: 52, y: panelY, width: panelWidth, height: panelHeight, framed: false, elements }, height, subtitle);
}

function composeTree(infographic, structure) {
  const { panelWidth, subtitle, panelY, fontSize } = sceneHeader(infographic, structure);
  const rootWidth = 360, childWidth = Math.min(280, (panelWidth - 96 - (structure.children.length - 1) * 28) / structure.children.length);
  const root = nodeCard(structure.root, structure.root.id, rootWidth, fontSize);
  const children = structure.children.map(item => nodeCard(item, item.id, childWidth, fontSize));
  const childHeight = Math.max(...children.map(child => child.height)), rootX = (panelWidth - rootWidth) / 2, rootY = 32;
  const childY = rootY + root.height + 142, childrenWidth = children.length * childWidth + (children.length - 1) * 28, childStartX = (panelWidth - childrenWidth) / 2;
  const trunkY = rootY + root.height + 58, rootBox = { x: rootX, y: rootY, width: rootWidth, height: root.height };
  const elements = [
    { id: 'tree-trunk', type: 'line', x: panelWidth / 2, y: rootY + root.height, x2: panelWidth / 2, y2: trunkY, stroke: '$secondary', strokeWidth: 3 },
    { id: 'tree-branch', type: 'line', x: childStartX + childWidth / 2, y: trunkY, x2: childStartX + (children.length - 1) * (childWidth + 28) + childWidth / 2, y2: trunkY, stroke: '$secondary', strokeWidth: 3 }
  ];
  children.forEach((child, index) => {
    const x = childStartX + index * (childWidth + 28), target = { x, y: childY, width: childWidth, height: child.height };
    const end = edgePoint(target, x + childWidth / 2, trunkY);
    elements.push({ id: `${root.id}-to-${child.id}`, type: 'arrow', x: x + childWidth / 2, y: trunkY, x2: end.x, y2: end.y, stroke: '$accent', strokeWidth: 3 });
  });
  elements.push(...drawNodeCard(root, rootX, rootY, rootWidth));
  children.forEach((child, index) => elements.push(...drawNodeCard(child, childStartX + index * (childWidth + 28), childY, childWidth)));
  const panelHeight = Math.ceil(childY + childHeight + 48), requiredHeight = panelY + panelHeight + 60, height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Tree needs ${requiredHeight} px height; shorten children or split the hierarchy.`);
  return composedScene(infographic, { id: 'tree', x: 52, y: panelY, width: panelWidth, height: panelHeight, framed: false, elements }, height, subtitle);
}

function composeNeighborhood(infographic, structure) {
  const { panelWidth, subtitle, panelY, fontSize } = sceneHeader(infographic, structure);
  const centerWidth = 330, neighborWidth = 250, centerX = panelWidth / 2, centerY = 410, radiusX = 500, radiusY = 260;
  const focus = nodeCard(structure.focus, structure.focus.id, centerWidth, fontSize);
  const neighbors = structure.neighbors.map(item => nodeCard(item, item.id, neighborWidth, fontSize));
  const focusBox = { x: centerX - centerWidth / 2, y: centerY - focus.height / 2, width: centerWidth, height: focus.height };
  const placed = neighbors.map((node, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / neighbors.length;
    return { ...node, x: centerX + radiusX * Math.cos(angle) - neighborWidth / 2, y: centerY + radiusY * Math.sin(angle) - node.height / 2, width: neighborWidth };
  });
  const panelHeight = Math.ceil(Math.max(focusBox.y + focusBox.height, ...placed.map(node => node.y + node.height)) + 48), requiredHeight = panelY + panelHeight + 60, height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Relationship neighborhood needs ${requiredHeight} px height; narrow the local context.`);
  const elements = [];
  for (const neighbor of placed) {
    const start = edgePoint(focusBox, neighbor.x + neighbor.width / 2, neighbor.y + neighbor.height / 2);
    const end = edgePoint(neighbor, focusBox.x + focusBox.width / 2, focusBox.y + focusBox.height / 2);
    elements.push({ id: `${focus.id}-to-${neighbor.id}`, type: 'line', x: start.x, y: start.y, x2: end.x, y2: end.y, stroke: '$secondary', strokeWidth: 3 });
  }
  for (const neighbor of placed) elements.push(...drawNodeCard(neighbor, neighbor.x, neighbor.y, neighbor.width));
  elements.push(...drawNodeCard(focus, focusBox.x, focusBox.y, focusBox.width));
  return composedScene(infographic, { id: 'neighborhood', x: 52, y: panelY, width: panelWidth, height: panelHeight, framed: false, elements }, height, subtitle);
}

function composeBarChart(infographic, structure) {
  const { panelWidth, subtitle, panelY, fontSize } = sceneHeader(infographic, structure);
  const plot = { x: 118, y: 64, width: panelWidth - 170, height: 430 }, max = Math.max(1, ...structure.items.map(item => item.value));
  const gap = 24, barWidth = (plot.width - gap * (structure.items.length - 1)) / structure.items.length;
  const panelHeight = 610, requiredHeight = panelY + panelHeight + 60, height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Bar chart needs ${requiredHeight} px height; increase the canvas.`);
  const elements = [
    { id: 'chart-y-axis', type: 'line', x: plot.x, y: plot.y, x2: plot.x, y2: plot.y + plot.height, stroke: '$secondary', strokeWidth: 3 },
    { id: 'chart-x-axis', type: 'line', x: plot.x, y: plot.y + plot.height, x2: plot.x + plot.width, y2: plot.y + plot.height, stroke: '$secondary', strokeWidth: 3 },
    { id: 'chart-y-label', type: 'text', text: structure.yAxis, x: 0, y: 18, width: plot.x - 20, fontSize: fontSize - 4, weight: 'semibold', fill: '$secondary', align: 'right' }
  ];
  for (let tick = 1; tick <= 4; tick++) {
    const value = max * tick / 4, y = plot.y + plot.height - plot.height * tick / 4;
    elements.push({ id: `chart-grid-${tick}`, type: 'line', x: plot.x, y, x2: plot.x + plot.width, y2: y, stroke: '$line', strokeWidth: 1, dash: [6, 8], geometryRole: 'illustration' });
    elements.push({ id: `chart-tick-${tick}`, type: 'text', text: String(Number(value.toFixed(2))), x: 0, y: y - (fontSize - 4) / 2, width: plot.x - 18, fontSize: fontSize - 6, fill: '$muted', align: 'right' });
  }
  structure.items.forEach((item, index) => {
    const barHeight = plot.height * item.value / max, x = plot.x + index * (barWidth + gap), y = plot.y + plot.height - barHeight;
    elements.push({ id: `${item.id}-bar`, type: 'rect', x, y, width: barWidth, height: barHeight, rx: 8, fill: '$accent', stroke: '$accent', strokeWidth: 1 });
    elements.push({ id: `${item.id}-value`, type: 'text', text: `${item.value}${structure.unit ?? ''}`, x, y: y - fontSize - 8, width: barWidth, fontSize: fontSize - 2, weight: 'semibold', fill: '$ink', align: 'center' });
    elements.push({ id: `${item.id}-label`, type: 'text', text: item.label, x, y: plot.y + plot.height + 16, width: barWidth, fontSize: fontSize - 4, fill: '$muted', align: 'center' });
  });
  return composedScene(infographic, { id: 'bar-chart', x: 52, y: panelY, width: panelWidth, height: panelHeight, framed: false, elements }, height, subtitle);
}

function comparisonSide(side, x, width, top, fontSize) {
  const boxId = `${side.id}-side`;
  const title = text(`${side.id}-title`, side.title, x + 24, top + 22, width - 48, fontSize + 8, 'semibold', boxId);
  let y = top + 22 + title.height + 12;
  const elements = [title.element];
  if (side.description) {
    const description = text(`${side.id}-description`, side.description, x + 24, y, width - 48, fontSize, 'regular', boxId);
    elements.push({ ...description.element, fill: '$secondary' });
    y += description.height + 18;
  }
  const items = side.items.map(item => {
    const itemId = `${side.id}-${item.id}`;
    const itemTitle = text(`${itemId}-title`, item.title, x + 42, 0, width - 84, fontSize + 2, 'semibold', itemId);
    const itemDescription = item.description ? text(`${itemId}-description`, item.description, x + 42, 0, width - 84, fontSize, 'regular', itemId) : null;
    const height = 24 + itemTitle.height + (itemDescription ? 8 + itemDescription.height : 0) + 20;
    return { item, itemId, itemTitle, itemDescription, height };
  });
  for (const item of items) {
    elements.push({ id: item.itemId, type: 'rect', x: x + 24, y, width: width - 48, height: item.height, rx: 8, fill: '$background', stroke: '$line', strokeWidth: 2 });
    elements.push({ ...item.itemTitle.element, y: y + 18 });
    if (item.itemDescription) elements.push({ ...item.itemDescription.element, y: y + 18 + item.itemTitle.height + 8, fill: '$secondary' });
    y += item.height + 14;
  }
  return { id: boxId, x, width, elements, height: y - top + 10 };
}

function composeComparison(infographic, structure) {
  const width = infographic.width ?? 1600;
  const fontSize = infographic.fontSize ?? 24;
  const panelWidth = width - 104;
  const cardWidth = (panelWidth - 80) / 2;
  const top = 100;
  const left = comparisonSide(structure.sides[0], 24, cardWidth, top, fontSize);
  const right = comparisonSide(structure.sides[1], 56 + cardWidth, cardWidth, top, fontSize);
  const panelHeight = Math.ceil(top + Math.max(left.height, right.height) + 24);
  const titleHeight = layoutText(infographic.title, width - 104, 42, 'semibold').height;
  const subtitle = structure.description ?? infographic.description;
  const subtitleHeight = layoutText(subtitle, width - 104, 20, 'regular').height;
  const panelY = Math.ceil(50 + titleHeight + 8 + subtitleHeight + 24);
  // Panels need their own bottom breathing room as well as the canvas footer.
  const requiredHeight = panelY + panelHeight + 200;
  const height = infographic.height ?? requiredHeight;
  if (height < requiredHeight || height > 4096) throw new Error(`Comparison needs ${requiredHeight} px height; increase the canvas or shorten the content.`);
  const panel = {
    id: 'comparison', x: 52, y: panelY, width: panelWidth, height: panelHeight,
    title: structure.title ?? infographic.title, kicker: 'COMPARISON', grid: false,
    elements: [
      { id: left.id, type: 'rect', x: left.x, y: top, width: left.width, height: Math.max(left.height, right.height), rx: 12, fill: '$panel', stroke: '$line', strokeWidth: 2 },
      { id: right.id, type: 'rect', x: right.x, y: top, width: right.width, height: Math.max(left.height, right.height), rx: 12, fill: '$panel', stroke: '$line', strokeWidth: 2 },
      ...left.elements, ...right.elements
    ]
  };
  const scene = {
    version: 1, title: infographic.title, description: infographic.description, subtitle, width, height,
    ...(infographic.theme ? { theme: infographic.theme } : {}), ...(infographic.palette ? { palette: infographic.palette } : {}), ...(infographic.sources ? { sources: infographic.sources } : {}), panels: [panel]
  };
  assertScene(scene);
  const report = inspectScene(scene);
  if (!report.ok) throw new Error(`Composed comparison failed validation: ${report.issues.filter(issue => issue.severity === 'error').map(issue => issue.message).join('; ')}`);
  return scene;
}

/** Compile a high-level infographic source into the engine's editable scene format. */
export function composeInfographic(infographic) {
  assertInfographic(infographic);
  if (!identifier.test(infographic.structure.type)) throw new Error('Invalid structure type.');
  switch (infographic.structure.type) {
    case 'sequence': return composeSequence(infographic, infographic.structure);
    case 'timeline': return composeTimeline(infographic, infographic.structure);
    case 'feedback-loop': return composeFeedbackLoop(infographic, infographic.structure);
    case 'relationship':
    case 'hierarchy': return composeLayered(infographic, infographic.structure);
    case 'neighborhood': return composeNeighborhood(infographic, infographic.structure);
    case 'tree': return composeTree(infographic, infographic.structure);
    case 'architecture-overview': return composeLayered(infographic, infographic.structure);
    case 'matrix': return composeMatrix(infographic, infographic.structure);
    case 'bar-chart': return composeBarChart(infographic, infographic.structure);
    case 'comparison': return composeComparison(infographic, infographic.structure);
    default: throw new Error(`Unsupported infographic structure: ${infographic.structure.type}.`);
  }
}
