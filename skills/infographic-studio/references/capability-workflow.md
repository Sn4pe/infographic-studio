# Composition with limited tools

Image generation, rendering tools, image viewing and composition quality are separate capabilities. Record which were actually available. The renderer does not inspect its own output or call image APIs.

## Data-only authoring

For architectures and processes made of related objects, prefer the [automatic document layout](document-layout.md). The free-placement contract below is available when exact geometry or a custom composition needs coordinates.

Supply this skill, the scene format, the content brief and this contract as text. Ask for exactly one JSON object with `scene` (a valid version-1 scene) and `placements` (an array, possibly empty). A trusted host expands it through the engine. Do not execute model-authored JavaScript.

```json
{
  "scene": {
    "version": 1,
    "title": "A reusable device",
    "description": "A device illustration and an editable label.",
    "width": 800, "height": 500, "theme": "paper",
    "panels": [{
      "id": "main", "x": 52, "y": 150, "width": 696, "height": 280,
      "elements": [{
        "id": "device-label", "type": "text", "x": 220, "y": 90,
        "width": 300, "text": "Monitoring device", "fontSize": 24
      }]
    }]
  },
  "placements": [{
    "panel": "main", "component": "device", "id": "sensor",
    "x": 40, "y": 50, "width": 140, "height": 140, "variant": "sealed"
  }]
}
```

The illustration above has no technical source; its missing-source warning is intentional. For real claims, include authentic `sources`. Do not fabricate references to clear a warning.

Each placement needs an existing panel ID, a unique component ID prefix, a component name and explicit numeric `x`, `y`, `width`, `height` in panel coordinates. Width and height must be positive. Optional `variant` defaults to `teal`. Unknown fields are rejected.

| Component | Variants |
| --- | --- |
| `person` | `teal`, `warm`, `elder` |
| `device` | `teal`, `blank`, `sealed` |
| `organization`, `document`, `container`, `network`, `plant`, `grid` | `teal` |

People preserve their aspect ratio; other objects occupy the specified box. Objects share the bundled flat palette and stroke rules. Components may form a larger illustration, but labels need separate space. The contract does not automatically arrange objects or route edges.

Placements are appended after the panel's primitives, in array order. Include backgrounds and connectors in `scene`, keeping connectors clear of illustration and label boxes. The compiler preserves wording, coordinates and order, adds artwork metadata and rejects duplicate IDs. It does not repair or approve a design.

```sh
node <repo>/cli/cli.js compose specification.json --out scene.json
node <repo>/cli/cli.js check scene.json --strict --json --print-width 180 --min-font 8
node <repo>/cli/cli.js render scene.json --out output --strict --print-width 180 --min-font 8
```

Use the actual target print size. `compose` refuses an existing output. With assets, keep the output beside the specification so relative paths stay valid. The host API is `composeSpecification(specification)`.

## Correction and review

1. Preserve the raw specification, capability record and validation report for each attempt. Separate name coverage from semantic correctness.
2. Return exact issue codes, affected IDs and messages to the author. Request a complete replacement specification. Do not invisibly fix coordinates, remove required content, shrink typography or relabel connectors to clear findings.
3. Stop after two self-corrections by default. State remaining issues and whether a draft could be rendered. More iteration or a different model must be visible in the record.
4. Inspect the PNG/PDF when viewing is available. Check whether connections express the intended relationships, not just whether lines avoid labels. Without a viewer, deliver useful draft artifacts with visual review pending.

Report layout checks, visual review and content review separately. `ok: true` means no errors; `--strict` also rejects warnings. `visualReview: "required"` and `scientificReview: "required"` describe engine limits. Record reviewer assessments separately. Passing mechanical checks never means a figure has been fact-checked or visually approved.
