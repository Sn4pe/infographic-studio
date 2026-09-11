// References share the IDs used by the renderer. Callers validate the scene first.
export function textEntries(scene) {
  const entries = [];
  const add = (owner, key, id, fontSize) => {
    if (owner[key]) entries.push({ owner, key, id, fontSize, text: owner[key] });
  };
  add(scene, 'title', 'figure-title', 42);
  add(scene, 'eyebrow', 'figure-eyebrow', 16);
  add(scene, 'subtitle', 'figure-subtitle', 20);
  add(scene, 'footer', 'figure-footer', 16);
  for (const panel of scene.panels) {
    add(panel, 'title', `${panel.id}-title`, 25);
    add(panel, 'kicker', `${panel.id}-kicker`, 16);
    for (const element of panel.elements) {
      if (['text', 'callout'].includes(element.type)) add(element, 'text', element.id, element.fontSize ?? 20);
    }
  }
  return entries;
}
