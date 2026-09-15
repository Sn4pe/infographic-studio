// Shared geometry keeps collision checks aligned with the actual exported arrowhead.
export function arrowGeometry(e) {
  const angle = Math.atan2(e.y2 - e.y, e.x2 - e.x);
  const length = Math.min(Math.hypot(e.x2 - e.x, e.y2 - e.y), Math.max(10, (e.strokeWidth ?? 2) * 3.5));
  const bx = e.x2 - length * Math.cos(angle), by = e.y2 - length * Math.sin(angle);
  return {
    base: [bx, by],
    head: [[e.x2, e.y2], [bx + length / 2 * Math.sin(angle), by - length / 2 * Math.cos(angle)], [bx - length / 2 * Math.sin(angle), by + length / 2 * Math.cos(angle)]],
  };
}
