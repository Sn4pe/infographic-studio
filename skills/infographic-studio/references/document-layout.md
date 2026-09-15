# Automatic layout of illustrated objects

Use this mode for simple related objects and processes. The model authors content and the relationships needed by this particular view; the engine measures text, combines each illustration with its title and description, places the complete units and routes connections around them. No coordinates are needed. Start with [composition-strategy.md](composition-strategy.md): choose the view's thesis and treat arrows as selected visual evidence, not an automatic rendering of every fact. Use an architecture overview for one readable journey, and a second figure for callbacks and protocol detail when necessary. Keep free scene placement for GraphRAG neighborhoods, branching flows, annotated data structures and physical/scientific geometry whose position carries meaning.

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

Each section requires unique `id`, `title`, `items`; optionally `description`, `layout`, `columns`, `groups`, `relations`. `architecture-overview` additionally requires `journey`: 2–8 unique relationship IDs forming one continuous directed path. Sections stack vertically and grow with their content. Section titles use body size + 8; object titles body size + 2. At 1600 px canvas width and 180 mm print width, a 26 px body exceeds 8 pt.

Each object requires unique `id`, `component`, `title`; optional `description`, `variant`. Components and variants are listed in [capability-workflow.md](capability-workflow.md). Omit `variant` for the default; `warm` is only a person variant, never a general color setting. The engine places a 72 px illustration beside the title, or above when a long title needs the full column width. `pipeline` gives components more space to establish reading order. The measured description follows below. All text remains editable.

| Layout | Arrangement |
| --- | --- |
| `row` | All objects in one row; fails when columns are too narrow |
| `column` | One object per row |
| `grid` | Explicit `columns`, or up to three columns by default |
| `cycle` | Exactly four objects, clockwise: top-left, top-right, bottom-right, bottom-left |
| `pipeline` | A spacious left-to-right process for 2–5 stages; use it when the sequence itself is the message |
| `architecture` | Layered, padded cards calculated from semantic nodes; requires `groups` and is for a bounded system architecture, not a dense graph |
| `architecture-overview` | The same layered cards, but it draws only one continuous `journey` through the complete relationship model. Use it for a readable system overview. |

Use 1–16 objects per section. `columns` applies only to `grid` and `architecture`. Do not add objects to satisfy a layout shape. If a cycle has a different number of concepts, use another layout or a free scene. The [Kubernetes gallery figure](../../../examples/architectures/kubernetes-cluster/scene.json) uses a free scene to combine runtime containment, ownership, traffic and replacement; it is not a document-layout template.

Relationships are explicit `{id, from, to, label?}` records, up to 32 per section. Endpoints must be object IDs in the same section. Layout order never creates an implied edge: for a closed four-step cycle, supply all four relationships including the return edge. Arrow direction follows `from` → `to`. Use a short `label` only when it changes the meaning of an edge; the compiler places labelled relationships in a readable section legend rather than risking labels over dense connectors. Cross-section connections are not supported.

`architecture` groups are `{id, title, items}` records. Every item must appear in exactly one group, and groups appear as horizontal layers in their listed order. The compiler creates a card for every item, reserves its interior padding, measures title and description in the card's usable width, and computes the row height before it draws an icon or route. Generated labels declare their card as the containment boundary, so strict validation rejects a local escape. Keep one section to 2–4 groups and 2–16 items. Split a service inventory across sections when it exceeds that scope; do not hand-place a card topology merely to fit more nodes.

For `architecture-overview`, keep the full `relations` list as the semantic model and select its one explanatory path in `journey`, for example `"journey": ["client-api", "api-kubelet", "kubelet-runtime"]`. The compiler keeps every component visible but routes only that path. This is a visual grammar choice, not a hand-tuned exception: it makes the reading order explicit and prevents callbacks, sibling dependencies and protocol detail from masquerading as the primary story. Put those relationships in a companion detail figure when the reader must inspect them.

Architecture routes attach to the computed card perimeter. Adjacent same-layer links run left to right; a link that skips an intermediate card uses the calculated lower card-padding corridor, and parallel cross-layer links get separate lanes through the reserved inter-layer corridor. Cross-layer links may connect only adjacent groups: add an explicit hand-off object or split the topology when a dependency skips a layer. The general router avoids complete object bounds and penalizes reusing existing segments. Neither mode turns a dense graph into a readable explanation automatically. Split dense fan-in or cross-cutting dependencies into a second figure instead of abandoning the semantic layout for hand coordinates. No content is removed to reduce edge density.

## Compose and revise

```sh
node <repo>/cli/cli.js compose document.json --out scene.json
node <repo>/cli/cli.js check scene.json --strict --print-width 180 --min-font 8
node <repo>/cli/cli.js render scene.json --out output --strict --print-width 180 --min-font 8
```

Programmatic entry point: `composeDocument(document)`, also supported by `composeSpecification({document})`. Output is an ordinary version-1 scene. Preserve the input document alongside exports: edit its wording or relationships and compose to a new scene to recompute sizes. Directly editing the compiled scene does not automatically reflow it.

When content does not fit, the error reports the required height or the object whose word exceeds its column. Increase the available canvas, use fewer columns for long titles, adjust wording without removing claims, or split the figure. Never lower the requested print readability to clear a fit error. Follow the same bounded correction and separate visual/content review protocol as other modes.
