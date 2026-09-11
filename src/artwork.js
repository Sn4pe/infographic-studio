// Metadata travels with the editable primitives; it never changes their rendering.
export function markArtwork(elements, id, bounds) {
  elements.forEach(e => { e.artworkId = id; delete e.artworkBounds; });
  if (elements.length) elements[0].artworkBounds = { ...bounds };
  return elements;
}
