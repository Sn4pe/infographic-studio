---
name: infographic-studio
description: Compose scientific and technical infographics with illustrations, editable labels and SVG, PNG or PDF exports. Use for explanatory figures, report illustrations, comparisons and annotated processes, including figures that combine generated artwork with precise text.
---

# Infographic Studio

Create a figure that explains its subject through objects, spatial relationships and annotations. Deliver the editable scene as well as the requested exports. This skill uses the Infographic Studio composition engine, not a collection of diagram templates.

## Runtime

Installed as a plugin, the engine lives in the plugin directory (`${CLAUDE_PLUGIN_ROOT}`, the parent of `skills/`). Dependencies are not installed by the plugin installer: if `node_modules` is missing there, run `npm ci --omit=dev --prefix "${CLAUDE_PLUGIN_ROOT}"` once, then call `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js"` in place of `infographic-studio` in every command below. Use `infographic-studio --help` when the CLI is on PATH instead. With a plain repository checkout, run `node <repo>/bin/cli.js` after `npm ci` in the repository. For a global CLI, run `npm install -g <repo>` when installing dependencies is in scope. This is an alpha preview; the API and layout contract may change. If only this skill folder was imported, locate the separately supplied runtime; do not invent a public installation URL or assume a skill-only import bundles Node.js or the engine.

Read [scene-format.md](references/scene-format.md) when authoring or modifying a scene. Read [illustration-workflow.md](references/illustration-workflow.md) when the figure needs raster artwork or supplied visual references.

## Match the workflow to available capabilities

Check tool access and image viewing independently; do not infer either from the model name. For related objects and processes, prefer [document-layout.md](references/document-layout.md): author illustrated objects and relationships without coordinates. Read [capability-workflow.md](references/capability-workflow.md) for the free-placement JSON contract and correction protocol.

- **No image generator:** use generic components, vector geometry or supplied local artwork. The renderer still exports PNG and PDF. Keep one component family, palette and stroke system across figures.
- **No runtime access:** return a `document` specification for automatically sized illustrated objects, or `scene` and `placements` when physical geometry needs free placement. A trusted host can run `compose` and return findings. Never present an unexecuted specification as a rendered figure.
- **No image viewing:** run available checks and deliver a draft with visual review pending. If another reviewer inspects the export, record that separately. A zero-issue report does not establish visual quality.
- **Limited composition ability:** reserve separate label and artwork areas and route connections around both. Allow at most two self-correction rounds by default, retaining responses and feedback. If problems remain, report them and the next useful step instead of silently substituting another model's design. Honor a different user-requested iteration budget.

## From content to figure

1. Identify the message the figure must communicate, exact claims, quantities, labels, target language and final viewing size. Use supplied references for visual direction; verify technical claims independently. Distinguish measured data from conceptual geometry.
2. Choose a composition around the explanation: a cutaway, field view, annotated object, before/after, sequence or complementary panels. Use the number of panels the content needs. Keep one visual anchor and a coherent palette. The provided examples are starting points, not a mandatory layout.
3. Create a version-1 `scene.json` with stable element IDs, or a JSON specification when tools are unavailable. Reuse generic components for common objects, primitives for scientific geometry and local PNG/JPEG illustrations for detailed imagery. Reserve separate artwork and label areas. Preserve component bounds metadata when editing, preferably by regenerating the component at its new position. Keep labels, numbers and formulas as scene text. Record content sources and asset provenance.
4. Run `infographic-studio check scene.json --strict`. Fix errors and resolve applicable warnings. A passing check verifies mechanical properties, not scientific truth. Do not suppress substantive warnings just to obtain a passing result.
5. Run `infographic-studio render scene.json --out output --strict`. With image viewing available, inspect the actual PNG and PDF at the intended viewing size. Check connections, silhouettes, label/artwork collisions, scientific relationships and reading order. Adjust and rerender within the correction budget. Without image viewing, mark visual review pending. A non-strict preview used to diagnose warnings must be labeled as a draft.
6. Deliver the scene, requested exports and any source images. State unresolved technical assumptions. When the user asks for a label correction, change that text element and rerender; preserve unrelated artwork.

For visual exploration, keep a shared brief with the exact required claims and labels, then create genuinely different compositions for that same content. The repository's `examples/fiber-study` demonstrates editorial, technical and hybrid directions. Use `framed: false` for open compositions and `callout` targets tied to stable object IDs for annotations that survive movement. Review leader endpoints after replacing an image: normalized anchors follow its box, not semantic features in new artwork.

## Decisions that matter

- **Geometry or data controls the meaning:** use deterministic paths and shapes, with values calculated from source data where applicable. Procedural waves are illustrative unless their parameters were derived from a model.
- **Illustration carries the explanation:** use an available image-generation tool to create text-free artwork, then compose precise vector labels. The CLI's `assets` command writes prompts; it does not generate images or call APIs.
- **A native editor format is requested:** use an available draw.io or other native tool and preserve its editable source. Do not claim this CLI exports `.drawio` files or automatically integrates third-party engines.
- **The scene is too dense:** simplify the explanation or increase the canvas. Do not shrink labels until they are unreadable.
- **A tool or provider is unavailable:** use vector artwork if it preserves the requested result, or identify the missing capability. Do not silently replace an elaborate illustration with a generic flowchart.

The engine supports Latin, Greek and Cyrillic glyphs covered by its bundled Source Sans 3 fonts. Unsupported glyphs fail validation rather than disappearing. Formula text supports Unicode symbols; it is not a LaTeX typesetter. Use a typesetting tool and import its raster output only when that tradeoff meets the user's editability needs.
