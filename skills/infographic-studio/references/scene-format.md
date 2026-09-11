# Scene format, version 1

The JSON Schema shipped with the runtime at `schema/scene.schema.json` is authoritative. Unknown properties and invalid types are rejected. Coordinates and sizes are SVG pixels.

## Canvas and panels

Required root fields: `version: 1`, `title`, `description` (accessible alternative description), `width`, `height`, and `panels`. Optional: `eyebrow`, `subtitle`, `footer`, `theme`, `palette`, `sources`, `assets`. The schema allows `$schema` for editor tooling.

Themes: `blueprint` (dark blue, coral and cream), `paper` (warm paper, teal and rust), `midnight` (slate and blue). Palette overrides use six-digit hex colors for `background`, `panel`, `ink`, `muted`, `line`, `accent`, `secondary`, `warm`. Element paint accepts those as `$accent`, etc., a six-digit hex color, or `none`.

The header starts at x=52, y=50, uses 42 px semibold text and wraps to canvas width minus 104. An optional subtitle sits 8 px below it. Leave 24 px between header and panels. For a single-line title plus subtitle, panels can start at y=182. Keep panel bottoms at least 60 px above the canvas bottom. Footer is a short line at y=height−44. Width/height range: 400–4096 / 300–4096.

Each panel requires `id`, `x`, `y`, `width`, `height`, `elements`; optional `title`, `kicker`, `grid` and `framed`. A title starts at local (24,36), 25 px semibold; leave body artwork below y=88 when using one. Omit the title and set `framed: false` for an open composition without the panel background or border. Element coordinates are relative to the panel origin. Artwork is not clipped: inspect paths and rotated elements visually. Panels must not overlap.

## Elements

All elements require unique `id` and `type`. IDs match `[a-zA-Z][a-zA-Z0-9_-]*`. Keep them stable across revisions.

| Type | Required fields | Meaning |
| --- | --- | --- |
| `rect` | x, y, width, height | Optional rx for corner radius |
| `ellipse` | x, y, rx, ry | x/y are the center |
| `polygon` | points | Array of at least three [x,y] pairs |
| `path` | d | Standard SVG path commands |
| `line`, `arrow` | x, y, x2, y2 | Arrowhead follows the final direction |
| `wave` | x, y, width, amplitude, cycles | y is baseline; phase is radians |
| `text` | x, y, width, text | x/y define the top-left of the wrapping box |
| `image` | x, y, width, height, asset | Reference to an asset ID |
| `icon` | x, y, width, height, icon | Bundled vector icon, e.g. `tabler/wallet` |
| `callout` | x, y, width, text, target | Wrapping label with an anchored leader |

Common styles: `fill`, `stroke`, `strokeWidth` (default 2), `opacity` (0–1), `dash` (numeric array), `rotation` (degrees around x/y, or 0/0 for a path). Shapes default to no fill and no stroke. Arrows should specify stroke. Text defaults to `$ink`, 20 px, regular weight.

Text options: `fontSize`, `weight` (`regular`, `semibold`), `align` (`left`, `center`, `right`). Width determines word wrapping. Explicit newlines are preserved; other whitespace is normalized. Height follows line count × fontSize × 1.3. Long unbreakable words fail validation rather than being truncated. Use separate text nodes for different styles. Rotation requires a visual bounds check.

Wave options: `phase`, `chirp` (nonnegative linear increase in spatial frequency), `envelope` (`constant`, `grow`, `pulse`). Chirps and envelopes are graphic primitives, not physical simulations. Use custom paths for data-driven plots.

Image option `fit`: `contain` (default) or `cover`. Raster assets remain raster; labels and geometric overlays remain vector.

Icon names come from `infographic-studio icons [query] --json`. The initial collection contains 17 pinned Tabler outline icons. Icons use `stroke` (default `$ink`) and `strokeWidth` (default 3 scene pixels). They retain the same stroke weight at different sizes and center within non-square boxes. Filled icons are rejected. Use one family and a shared stroke weight across a figure; apply colours consistently by role. Icons export as editable paths with a `credits.txt` license file, SVG license metadata and source hashes in the report. This is a restricted catalog, not arbitrary SVG import.

## Artwork bounds and collision checks

Component and illustration factories tag primitives with `artworkId`; exactly one member per group carries `artworkBounds: {x, y, width, height}` in panel coordinates. Keep the metadata in saved scenes. Regenerate components at new coordinates or update all parts and bounds together. The renderer ignores this metadata. `createSection()` leaves layers ungrouped so scientific geometry and annotations can share a material view.

Checks warn when measured text lines overlap declared artwork boxes in either paint order. They also detect later opaque rectangles, ellipses and images over earlier labels in older flattened scenes. Straight lines, arrows and `M/L/H/V/Z` paths are checked against text and for passing through declared artwork without an endpoint inside it. Earlier backgrounds under labels and connectors ending on their target are allowed.

An ungrouped `line` or `path` representing physical geometry, such as a mast behind a device, may use `geometryRole: "illustration"`. This skips connector-through-artwork warnings but still checks crossings with text. Default behavior, or `geometryRole: "connector"`, checks both. Arrows cannot opt out. Do not change a relationship edge's role just to clear a warning.

These are conservative geometry checks. Curved paths, rotated elements, raster transparency, arrowhead outlines and the accuracy of supplied artwork boxes need visual inspection. The checks do not infer object or connection meaning.

## Anchored callouts

```json
{
  "id": "core-label", "type": "callout",
  "x": 28, "y": 40, "width": 280,
  "text": "Core · n₁", "fontSize": 25, "weight": "semibold",
  "target": { "element": "fibre-hero", "at": [0.315, 0.485] },
  "side": "bottom", "stroke": "$ink"
}
```

`target` accepts a local `[x,y]` point or an object reference in the same panel. Object anchors use normalized `[u,v]` coordinates from 0 to 1 within the element's bounding box; the default is its center. Supported targets are unrotated rectangles, ellipses, images, icons, waves and text. Use an explicit point for paths, polygons or rotated artwork. Image and icon anchors refer to the full placement box, including any letterboxing; they do not detect features inside the artwork.

The endpoint follows object movement and resizing on every render. Text wrapping adjusts the leader's starting position. `side` can be `auto`, `left`, `right`, `top` or `bottom`; default is `auto`. `stroke` and `strokeWidth` style the leader; ordinary text options style the label. Rotated callouts are unsupported. The exported label keeps its ID; generated leader and anchor IDs append `-leader` and `-anchor`, so reserve those names.

Checks reject missing, ambiguous or unsupported targets and endpoints outside the panel. They warn when an endpoint lands on a label. Leaders do not automatically avoid obstacles: inspect the whole path and confirm the endpoint identifies the intended material, especially after replacing an image.

## Minimal scene

```json
{
  "version": 1,
  "title": "A signal in context",
  "description": "A stylized waveform and its editable annotation.",
  "width": 800,
  "height": 520,
  "theme": "paper",
  "panels": [{
    "id": "signal", "x": 52, "y": 150, "width": 696, "height": 280,
    "title": "Oscillation",
    "elements": [
      { "id": "wave", "type": "wave", "x": 32, "y": 140, "width": 600, "amplitude": 24, "cycles": 6, "stroke": "$accent", "strokeWidth": 3 },
      { "id": "label", "type": "text", "x": 32, "y": 196, "width": 600, "text": "Illustrative waveform; not measured data." }
    ]
  }]
}
```

This example intentionally has no sources, so a non-strict check warns. Add real sources for technical claims; do not invent citations just to satisfy a check.

`sources` is an array of `{ "title": "...", "url": "https://..." }`. It is included in SVG metadata, not automatically printed as a bibliography. Use `footer` or explicit labels for a visible citation.

`report.json` records schema/layout findings, output files, scene/asset hashes and explicit requirements for scientific and visual review. It does not claim to fact-check sources, spellcheck, detect every artwork overlap, or guarantee print legibility.
