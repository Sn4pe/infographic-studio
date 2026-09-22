---
name: infographic-studio
description: Compose scientific and technical infographics with illustrations, editable labels and SVG, PNG or PDF exports. Use for explanatory figures, report illustrations, comparisons and annotated processes, including figures that combine generated artwork with precise text.
---

# Infographic Studio

Create any infographic or diagram that can be expressed as editable artwork, geometry, labels and spatial relationships. Deliver the editable scene as well as the requested exports. This skill guides the agent's design and review work; Infographic Studio is the production engine, not a collection of diagram templates.

## Runtime

Installed as a plugin, the engine lives in the plugin directory (`${CLAUDE_PLUGIN_ROOT}`, the parent of `skills/`). Dependencies are not installed by the plugin installer: if `node_modules` is missing there, run `npm ci --omit=dev --prefix "${CLAUDE_PLUGIN_ROOT}"` once, then call `node "${CLAUDE_PLUGIN_ROOT}/cli/cli.js"` in place of `infographic-studio` in every command below. Use `infographic-studio --help` when the CLI is on PATH instead. With a plain repository checkout, run `node <repo>/cli/cli.js` after `npm ci` in the repository. For a global CLI, run `npm install -g <repo>` when installing dependencies is in scope. This is an alpha preview; the API and layout contract may change. If only this skill folder was imported, locate the separately supplied runtime; do not invent a public installation URL or assume a skill-only import bundles Node.js or the engine.

Read [composition-strategy.md](references/composition-strategy.md) before authoring every figure. Read [scene-format.md](references/scene-format.md) when authoring or modifying a scene. Read [infographic-format.md](references/infographic-format.md) when the chosen structure fits the declarative infographic source. Read [illustration-workflow.md](references/illustration-workflow.md) when the figure needs raster artwork or supplied visual references.

## Required production path

When this skill is invoked, Infographic Studio is the production engine
for the final figure whenever its runtime is available.

Do not substitute Design, Artifacts, HTML, Canvas, another diagram
generator, or another document-generation tool for Infographic Studio.

Before using the no-runtime fallback, verify that the Infographic Studio
CLI cannot actually be executed. Do not infer runtime availability from
the model name or from the presence of other design tools.

For hybrid figures, image-generation tools are auxiliary tools only.
Use them to create text-free raster artwork, then import that artwork
into the Infographic Studio scene. Keep titles, labels, annotations,
numbers, connectors, and other precise content editable in the scene.

The final composition, validation, and rendering must be performed with
Infographic Studio:

1. Create or update the Infographic Studio scene.
2. Run `check --strict`.
3. Run `render --strict`.
4. Inspect the rendered result when image viewing is available.
5. Correct the scene and rerender when necessary.

If the runtime genuinely cannot be executed, return an editable
Infographic Studio specification and clearly state that it has not been
validated or rendered. Do not present output from another production
tool as an Infographic Studio render.

## Match the workflow to available capabilities

Check tool access and image viewing independently; do not infer either from the model name. The free-placement scene is the general authoring surface: use it for any composition that needs an intentional visual hierarchy, such as an illustrated explanation, cutaway, physical mechanism, architecture, graph, comparison, timeline, map, data display or annotated process. It supports arbitrary editable vector geometry, components, icons, local artwork and anchored labels.

Use [infographic-format.md](references/infographic-format.md) when one of its named structures genuinely fits the explanation. Use [document-layout.md](references/document-layout.md) for its lower-level illustrated-object contract when a simple process or bounded layered topology needs direct control. Both are automatic sizing and routing shortcuts, never the default visual language and never substitutes for a composition whose meaning depends on spatial design. Read [capability-workflow.md](references/capability-workflow.md) for the free-placement JSON contract and correction protocol.

- **No image generator:** use generic components, vector geometry or supplied local artwork. The renderer still exports PNG and PDF. Keep one component family, palette and stroke system across figures.
- **No runtime access:** return a `document` specification for automatically sized illustrated objects, or `scene` and `placements` when physical geometry needs free placement. A trusted host can run `compose` and return findings. Never present an unexecuted specification as a rendered figure.
- **No image viewing:** run available checks and deliver a draft with visual review pending. If another reviewer inspects the export, record that separately. A zero-issue report does not establish visual quality.
- **Limited composition ability:** reserve separate label and artwork areas and route connections around both. Allow at most two self-correction rounds by default, retaining responses and feedback. If problems remain, report them and the next useful step instead of silently substituting another model's design. Honor a different user-requested iteration budget.

## From content to figure

1. Identify the message the figure must communicate, exact claims, quantities, labels, target language and final viewing size. For a documentation set, choose the few messages an audience should remember; do not make one figure for every heading. Use supplied references for visual direction; verify technical claims independently. Distinguish measured data from conceptual geometry.
2. Establish art direction before authoring geometry. If the user supplied a reference or named a style, follow it. If no visual treatment is specified and the choice materially changes the result, ask one concise question with distinct options, for example: editorial illustration, formal technical diagram, or presentation graphic. Do not ask when the requested form already determines the treatment, such as an ERD, sequence diagram or a publication-ready scientific plot.
3. Write a compact composition brief before creating the scene: the complete model, one thesis, the visible evidence needed to establish it, visual anchor, reading order, relationship geometry, panel count and why this composition explains the subject. Select from any appropriate composition—cutaway, exploded view, layered system, graph neighborhood, before/after, sequence, timeline, map, chart or complementary panels. Do not force the brief into rows of icons or a stock flowchart. The supplied examples demonstrate possible directions, not a house layout. Do not map every source relationship to an arrow: keep one focused route where direction proves the thesis, use grouping or annotation for context, and use a detail figure when the full model is needed.
4. Choose the production contract. Prefer a free `scene.json` for the composition brief. Use semantic `document` layout only when it preserves the intended composition while removing routine object sizing and routing. Reuse generic components for common objects, primitives and paths for domain geometry, and local PNG/JPEG illustrations when detailed artwork carries the explanation. Preserve labels, numbers and formulas as editable scene text. Record content sources and asset provenance.
5. Before rendering, make containment explicit: reserve label and artwork regions, attach internal labels to their card or zone using `container`, and route connectors outside artwork and text bounds. Preserve component bounds metadata when editing, preferably by regenerating the component at its new position. This is design work, not a post-hoc cosmetic fix.
6. Run `infographic-studio check scene.json --strict`, then `infographic-studio render scene.json --out output --strict`. Fix errors and applicable warnings. A passing check verifies mechanical properties, not scientific truth or visual quality.
7. With image viewing available, inspect the actual PNG and PDF at intended size. Check the reading order, visual anchor, relationship geometry, label/artwork collisions, leader and arrow paths, and whether all claims remain legible. For a batch, inspect the figures together for repeated compositions. Adjust and rerender within the correction budget. Without image viewing, mark visual review pending. A non-strict preview used to diagnose warnings must be labeled as a draft.
8. Deliver the scene, requested exports and any source images. State unresolved technical assumptions. When the user asks for a label correction, change that text element and rerender; preserve unrelated artwork.

For visual exploration, keep a shared brief with the exact required claims and labels, then create genuinely different compositions for that same content. The repository's curated examples combine physical cutaways, material circuits, energy balances, staged transformations and multiple architectural views. They use free scenes when domain geometry carries the explanation. Apply the text-hidden review in [composition-strategy.md](references/composition-strategy.md) before accepting an illustrated explanation. Use `framed: false` for open compositions and `callout` targets tied to stable object IDs for annotations that survive movement. Review leader endpoints after replacing an image: normalized anchors follow its box, not semantic features in new artwork.

## Decisions that matter

- **Geometry or data controls the meaning:** use deterministic paths and shapes, with values calculated from source data where applicable. Procedural waves are illustrative unless their parameters were derived from a model.
- **Illustration carries the explanation:** use an available image-generation tool to create text-free artwork, then compose precise vector labels. The CLI's `assets` command writes prompts; it does not generate images or call APIs.
- **A native editor format is requested:** use an available draw.io or other native tool and preserve its editable source. Do not claim this CLI exports `.drawio` files or automatically integrates third-party engines.
- **The scene is too dense:** revisit the thesis and visual grammar before changing geometry. Move a second claim to a companion figure, re-encode contextual relationships with grouping or annotation, or increase the canvas only when the selected evidence truly needs more space. Do not shrink labels until they are unreadable.
- **The output looks like a repeated icon row:** do not add decoration to the same layout. Select a composition whose geometry explains the idea, or use a free scene with a large visual anchor and supporting annotations.
- **A tool or provider is unavailable:** use vector artwork if it preserves the requested result, or identify the missing capability. Do not silently replace an elaborate illustration with a generic flowchart.

The engine supports Latin, Greek and Cyrillic glyphs covered by its bundled Source Sans 3 fonts. Unsupported glyphs fail validation rather than disappearing. Formula text supports Unicode symbols; it is not a LaTeX typesetter. Use a typesetting tool and import its raster output only when that tradeoff meets the user's editability needs.
