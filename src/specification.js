import { assertScene } from './validate.js';
import { createComponent } from './components.js';
import { composeDocument } from './document.js';

// A small data-only boundary for authors without shell or rendering tools.
// Coordinates and wording belong to the author; the host never invents or repairs layout.
export function composeSpecification(specification) {
  if (specification && typeof specification === 'object' && !Array.isArray(specification) && Object.hasOwn(specification,'document')) {
    if (Object.keys(specification).length !== 1) throw new Error('A document specification contains only document.');
    return composeDocument(specification.document);
  }
  if (!specification || typeof specification !== 'object' || Array.isArray(specification) ||
      Object.keys(specification).some(key => !['scene','placements'].includes(key)) || !Array.isArray(specification.placements)) {
    throw new Error('A composition specification contains only scene and a placements array.');
  }
  assertScene(specification.scene);
  const scene = structuredClone(specification.scene);
  const allowed = new Set(['panel','component','id','x','y','width','height','variant']);
  for (const placement of specification.placements) {
    if (!placement || typeof placement !== 'object' || Array.isArray(placement) || Object.keys(placement).some(key => !allowed.has(key))) throw new Error('Invalid component placement fields.');
    const {panel:panelId,component,...options} = placement;
    if (!['x','y','width','height'].every(key => Number.isFinite(options[key]))) throw new Error(`Placement ${options.id ?? '?'} needs explicit numeric x, y, width and height.`);
    const panels = scene.panels.filter(p => p.id === panelId);
    if (panels.length !== 1) throw new Error(`Placement ${options.id ?? '?'} needs one existing panel: ${panelId}.`);
    panels[0].elements.push(...createComponent(component,options));
  }
  assertScene(scene);
  const ids = scene.panels.flatMap(p => [p.id,...p.elements.map(e=>e.id)]);
  if (new Set(ids).size !== ids.length) throw new Error('Composition creates duplicate scene IDs. Use a unique prefix per placement.');
  return scene;
}
