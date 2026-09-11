# Combining illustrations and exact text

Use image generation when texture, organic structures or a detailed physical scene improve the explanation. Use deterministic vectors when geometry carries technical meaning. Both can coexist in one panel.

## Asset contract

Declare each image at the scene root:

```json
{
  "assets": {
    "reactor": {
      "description": "Cutaway of a laboratory reactor, with the vessel and impeller visible.",
      "prompt": "Editorial scientific cutaway of a stirred vessel. Three-quarter view. Muted teal and warm cream. Isolate the vessel on a uniform background. Leave negative space around it.",
      "provenance": "Record the provider, model and creation date after generation.",
      "license": "Record the applicable usage terms after checking them."
    }
  }
}
```

Place an image element with `asset: "reactor"` in a panel. Run `infographic-studio assets scene.json` to get the prompt and placement dimensions. This command makes no network calls, incurs no generation fees and does not claim that a path-specified asset exists.

Use an available image-generation tool with the prompt. Inspect the returned illustration for incorrect anatomy, impossible geometry and unintended text. Save an accepted PNG/JPEG inside the scene directory (for example `assets/reactor.png`) and set the asset's `path` to that relative path. Use authentic provenance and license information instead of the explanatory strings above. The engine embeds local image bytes in the SVG, so final exports do not depend on external URLs.

Create annotations with `callout` elements targeting the image's stable ID and normalized positions. Use separate text and geometry when a custom annotation shape is needed. All precise numbers, units, labels and equations should be in that layer. Correcting a label should not require another image-generation call. Anchors follow image placement, but replacing the image requires another visual endpoint review.

## Completed example

In the runtime repository, `examples/fiber-study/hybrid` contains a transparent fibre cutaway, its exact generation prompt and provenance, the editable scene, and SVG/PNG/PDF exports. The image establishes the physical structure; deterministic vectors explain the ray and incidence angle. Two vector-only variants explain the same content, defined once in `examples/fiber-study/brief.json`.

To make a text-only correction, edit the callout's `text` in `scene.json`, rerender and compare the asset hash in `report.json`. The source image and embedded artwork should remain identical. `npm run examples` rerenders existing scenes without generating images. `npm run study` reconstructs the study scenes from code and overwrites JSON edits; reserve it for changes to the shared construction.

## References and rendering

- Translate a reference into palette, line style, texture, density and composition decisions. Do not assume its scientific explanation is correct.
- Keep illustration scale and direction consistent across panels. A technically meaningful arrow must start/end on the intended structure.
- Use `contain` to preserve an entire image; `cover` fills a box and may crop it. Prefer transparent PNG for cutouts and inspect edge contrast.
- The runtime accepts local PNG/JPEG files only. It does not load URLs, execute provider commands, or import raw SVG/XML. Use scene paths for editable vectors, or export an external SVG drawing to PNG when editability is not required.
- A missing image is a hard render error, never an invisible placeholder.

## Available integrations

Infographic Studio is provider-neutral at the asset boundary. Image generation happens through the host agent's tools. draw.io, AntV and diagram-design can be used independently when installed, but they are not runtime dependencies or implemented backend adapters in v0.1. Do not describe them as connected without verifying the actual environment.

When an agent host imports only this skill folder, it still needs the separately installed CLI and a filesystem with Node.js 22+. Import into AgentOS is an integration path to verify in that deployment; it is not evidence of a tested AgentOS connector.
