# Declarative infographic source

Use this source contract when the content fits one of the built-in information structures. It separates the information structure from the editable `scene.json` that the engine emits. First choose the figure's thesis and grammar using [composition-strategy.md](composition-strategy.md): a source model can contain more context than one view should render. Do not expose compiler coordinates to the user or hand-adjust the generated scene to compensate for a poor content structure; revise the source instead.

```json
{
  "infographic": {
    "title": "A title", "description": "Accessible figure description.",
    "width": 1600, "theme": "paper",
    "sources": [{"title": "Supplied reference", "url": "https://example.org/reference"}],
    "structure": {"type": "comparison", "sides": []}
  }
}
```

Shared fields are `title`, `description`, optional `width`, `height`, `fontSize`, `theme`, `palette` and `sources`. `compose` accepts this file and writes an ordinary editable scene. Its schema is `schema/infographic.schema.json`.

| Structure | Use when | Required content |
| --- | --- | --- |
| `sequence` | Ordered stages carry the message | 2–5 illustrated `items`; links are inferred unless `relations` are supplied |
| `timeline` | Chronology or ordered milestones carry the message | 2–8 dated or ordered `items`, arranged along one time spine |
| `feedback-loop` | A causal process repeats or feeds back into itself | 3–6 ordered stages arranged in a closed, directed loop |
| `relationship` | A bounded system has explicit layers and downward relationships | 2–4 ordered `groups`, illustrated `items`, optional `relations` |
| `neighborhood` | One object and its immediate context need focus | A focal node and 2–6 neighbor nodes; connector lines show only that local scope |
| `hierarchy` | A hierarchy can be represented as ordered levels | The same `groups`, `items` and optional downward `relations` contract as `relationship` |
| `tree` | One root divides into a bounded first level | One root and 2–6 child nodes, with generated trunk and branches |
| `architecture-overview` | A large system needs one legible explanation path while other components stay visible | Ordered `groups`, complete `items` and `relations`, plus a continuous `journey` of 2–8 relation IDs |
| `matrix` | Four positions must be read against two named axes | `xAxis`, `yAxis` and exactly four descriptive `quadrants` |
| `bar-chart` | A small numerical comparison is the thesis | `yAxis`, optional `unit` and 2–8 non-negative labeled values |
| `comparison` | Two alternatives, mechanisms or states need equal visual treatment | Exactly two `sides`, each with a title, optional description and 1–6 text items |

For `sequence`, `relationship`, `hierarchy` and `architecture-overview`, an item is `{id, component, title, description?, variant?}`. Components are the same generic editable objects listed in [capability-workflow.md](capability-workflow.md). Relationships are `{id, from, to, label?}`. A relation is a visual claim, not a requirement to draw every fact as an arrow: select the structure only when its visible treatment proves the figure's thesis. An `architecture-overview` formalizes that choice by keeping the complete relationship model while rendering its required `journey` as one continuous path; it preserves every other object as context without turning the overview into a dense connector graph.

`feedback-loop`, `tree` and `neighborhood` use descriptive nodes `{id, title, context?, description?}`. `neighborhood` requires `context` on every neighbor so the line has an explicit meaning without adding an ambiguous arrow label. `bar-chart` items are `{id, label, value}` and must represent supplied or cited values; it never fabricates measurements to make a chart. The loop and tree create only their bounded directional links. A broader graph belongs in a deliberately scoped neighborhood, a companion detail figure, or a free scene.

For `comparison`, use text content rather than fabricated numeric data:

```json
{
  "structure": {
    "type": "comparison",
    "title": "Band and dots have different roles",
    "sides": [
      {"id": "band", "title": "Solid frit band", "items": [
        {"id": "uv", "title": "UV shield", "description": "Protects the bond line."}
      ]},
      {"id": "dots", "title": "Dot matrix", "items": [
        {"id": "transition", "title": "Thermal transition", "description": "Fades into clear glass."}
      ]}
    ]
  }
}
```

Use a free `scene.json` when none of these structures communicates the subject. That is an intentional custom composition, not an error or degraded result. Keep the source brief, composition plan and the generated scene together so that a later revision can preserve the visual direction.
