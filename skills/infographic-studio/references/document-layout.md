# Automatic layout of illustrated objects

Use this mode for related objects, processes and architecture explanations. The model authors content and explicit relationships; the engine measures text, combines each illustration with its title and description, places the complete units and routes connections around them. No coordinates are needed. Keep free scene placement for physical/scientific geometry whose position carries meaning.

## Contract

Return one JSON object containing only `document`. Do not mix it with `scene` or `placements`.

```json
{
  "document": {
    "title": "From observation to evidence",
    "description": "An illustrated measurement workflow.",
    "width": 1600,
    "fontSize": 26,
    "sections": [{
      "id": "capture", "title": "Observe and preserve",
      "layout": "row",
      "items": [
        {"id": "sensor", "component": "device", "title": "Measure", "description": "Capture the reading and its timestamp."},
        {"id": "record", "component": "document", "title": "Record", "description": "Keep units and calibration information."}
      ],
      "relations": [{"id": "capture-record", "from": "sensor", "to": "record"}]
    }]
  }
}
```

This generic example intentionally omits technical sources. Add authentic `sources` for real technical claims; do not invent citations to clear the missing-source warning.

Document fields: required `title`, `description`, `sections`; optional `width` (default 1600), `height`, `fontSize` (body text, default 26), `theme`, `palette`, `sources`. Themes are `paper`, `blueprint`, `midnight`; palette uses the scene's six-digit hex tokens. Sources must be objects, for example `[{"title":"Supplied project repository","url":"https://example.org/project"}]`, not URL strings. Use the exact supplied source; do not substitute another similarly named project. Height is computed from measured content unless supplied. A supplied height is a hard limit, not permission to shrink or crop text. Output dimensions remain within the scene schema's 4096 px limit. `schema/document.schema.json` is authoritative; independent schema errors are returned together before layout.

Each section requires unique `id`, `title`, `items`; optionally `description`, `layout`, `columns`, `relations`. Sections stack vertically and grow with their content. Section titles use body size + 8; object titles body size + 2. At 1600 px canvas width and 180 mm print width, a 26 px body exceeds 8 pt.

Each object requires unique `id`, `component`, `title`; optional `description`, `variant`. Components and variants are listed in [capability-workflow.md](capability-workflow.md). Omit `variant` for the default; `warm` is only a person variant, never a general color setting. The engine places a 72 px illustration beside the title, or above when a long title needs the full column width. The measured description follows below. All text remains editable. Objects are open compositions, without a mandatory surrounding box.

| Layout | Arrangement |
| --- | --- |
| `row` | All objects in one row; fails when columns are too narrow |
| `column` | One object per row |
| `grid` | Explicit `columns`, or up to three columns by default |
| `cycle` | Exactly four objects, clockwise: top-left, top-right, bottom-right, bottom-left |

Use 1–16 objects per section. `columns` applies only to `grid`. Do not add objects to satisfy a layout shape. If a cycle has a different number of concepts, use another layout or a free scene.

Relationships are explicit `{id, from, to}` records, up to 32 per section. Endpoints must be object IDs in the same section. Layout order never creates an implied edge: for a closed four-step cycle, supply all four relationships including the return edge. Arrow direction follows `from` → `to`. Put action wording in the relevant object's description; edge labels and cross-section connections are not supported in this initial mode.

The orthogonal router avoids complete object bounds and penalizes reusing existing segments. It does not guarantee crossing-free graphs or distinguish the meaning of different relationships. Dense fan-in, arrows ending in whitespace around open objects, and every scientific/architectural relationship still need visual review. No content is removed to reduce edge density.

## Compose and revise

```sh
node <repo>/bin/cli.js compose document.json --out scene.json
node <repo>/bin/cli.js check scene.json --strict --print-width 180 --min-font 8
node <repo>/bin/cli.js render scene.json --out output --strict --print-width 180 --min-font 8
```

Programmatic entry point: `composeDocument(document)`, also supported by `composeSpecification({document})`. Output is an ordinary version-1 scene. Preserve the input document alongside exports: edit its wording or relationships and compose to a new scene to recompute sizes. Directly editing the compiled scene does not automatically reflow it.

When content does not fit, the error reports the required height or the object whose word exceeds its column. Increase the available canvas, use fewer columns for long titles, adjust wording without removing claims, or split the figure. Never lower the requested print readability to clear a fit error. Follow the same bounded correction and separate visual/content review protocol as other modes.
