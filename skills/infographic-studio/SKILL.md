---
name: infographic-studio
description: Compose scientific and technical infographics with illustrations, editable labels and SVG, PNG or PDF exports. Use for explanatory figures, report illustrations, comparisons and annotated processes, including figures that combine generated artwork with precise text.
---

# Infographic Studio

Create any infographic or diagram that can be expressed as editable artwork, geometry, labels and spatial relationships.
Deliver the editable scene as well as the requested exports.

This skill guides the agent's design and review work. Infographic Studio is the production engine, not a collection of
diagram templates.

## Runtime

Resolve the runtime in this order. Do not skip to a later step without trying the earlier ones; do not infer
unavailability from the host name or from the presence of other tools.

**1. PATH** — If `infographic-studio` is available on PATH, use it for every command below.

**2. Plugin root (full runtime, Claude Code and Codex)** — If `CLAUDE_PLUGIN_ROOT` is set, call
`node "${CLAUDE_PLUGIN_ROOT}/cli/cli.js"` in place of `infographic-studio`. If `node_modules` is missing there, run
`npm ci --omit=dev --prefix "${CLAUDE_PLUGIN_ROOT}"` once first. This path gives SVG, PNG and PDF.

**3. Portable runtime (Claude.ai and skill-only installations)** — A self-contained CLI is bundled with this skill at
`scripts/portable-cli.mjs`. Locate it by taking the directory that contains this SKILL.md file and appending
`scripts/portable-cli.mjs`. Run it as:

`node /absolute/path/to/skills/infographic-studio/scripts/portable-cli.mjs`

No `npm install` is required. Supports **SVG and PDF**; PNG is unavailable because the portable runtime does not include
the native `@resvg/resvg-js` binary. When using this runtime, always pass `--formats svg,pdf` to render commands. The
`init` command is also unavailable; create scene files directly.

**4. No runtime** — Return an editable Infographic Studio specification and clearly state it has not been validated or
rendered. Do not present output from another tool as an Infographic Studio render.

With a plain repository checkout, run `node <repo>/cli/cli.js` after `npm ci` in the repository. For a global CLI, run
`npm install -g <repo>`. This is an alpha preview; the API and layout contract may change.

Read [composition-strategy.md](references/composition-strategy.md) before authoring every figure.
Read [scene-format.md](references/scene-format.md) when authoring or modifying a scene.
Read [infographic-format.md](references/infographic-format.md) when the chosen structure fits the declarative
infographic source. Read [illustration-workflow.md](references/illustration-workflow.md) when the figure needs raster
artwork or supplied visual references.

## Required production path

When this skill is invoked, Infographic Studio is the production engine for the final figure whenever its runtime is
available.

Do not substitute Design, Artifacts, HTML, Canvas, another diagram generator, or another document-generation tool for
Infographic Studio.

Before using the no-runtime fallback, verify that the Infographic Studio CLI cannot actually be executed. Do not infer
runtime availability from the model name or from the presence of other design tools.

The final composition, validation and rendering must be performed with Infographic Studio:

1. Create or update the Infographic Studio scene.
2. Run `check --strict`.
3. Run `render --strict`.
4. Inspect the rendered result when image viewing is available.
5. Correct the scene and rerender when necessary.

If the runtime genuinely cannot be executed, return an editable Infographic Studio specification and clearly state that
it has not been validated or rendered. Do not present output from another production tool as an Infographic Studio
render.

## Default visual workflow

Choose between a **hybrid** and a **vector-first** workflow before authoring the final scene.

### Infographics default to hybrid

For general-purpose infographics, editorial explainers, report illustrations and presentation graphics, use the **hybrid
workflow by default** when an image-generation tool is available.

Hybrid is the default production workflow for these formats, not an optional visual enhancement.

Do not switch to vector-only composition merely because the information can be represented with cards, boxes, icons,
timelines or text.

The user does not need to request "hybrid mode", "illustrations" or "renders". Select hybrid automatically for an
infographic when image generation is available.

### When to use vector-first instead

Use a vector-first workflow when the requested figure is fundamentally defined by exact geometry, topology, quantitative
data or precise spatial relationships.

Typical vector-first cases include:

- architecture diagrams;
- network topology;
- charts and plots;
- mathematical or scientific diagrams where geometry carries meaning;
- schematics;
- exact process geometry;
- data visualizations where generated imagery would reduce precision.

If image generation is unavailable, use vector-first automatically.

Do not treat the absence of image generation as a reason to abandon Infographic Studio.

## Hybrid workflow

Hybrid means **generated raster artwork + Infographic Studio composition**.

A vector-only composition is not hybrid, regardless of how decorative or illustrative its vector elements are.

When hybrid is selected and an image-generation tool is available:

1. Define the visual role of the illustration from the composition brief.
2. Generate at least one text-free raster illustration.
3. Inspect the generated artwork.
4. Reject artwork containing unintended text, misleading geometry, impossible structures or visual elements that
   contradict the explanation.
5. Save the accepted PNG/JPEG locally.
6. Declare it as an asset in the Infographic Studio scene.
7. Build the final composition around the accepted artwork.
8. Keep all precise information in the editable Infographic Studio layer.
9. Validate and render with Infographic Studio.

**Do not begin final scene composition until the required hybrid artwork has been generated and accepted.**

If generated imagery would not materially improve the requested figure, explicitly choose vector-first instead of
selecting hybrid and silently omitting generated artwork.

### What belongs in generated artwork

Use generated imagery for things such as:

- the main visual subject;
- physical scenes;
- editorial or conceptual illustrations;
- cutaways where exact geometry is not authoritative;
- environments;
- objects;
- people or abstract visual metaphors when appropriate;
- texture and visual context;
- a strong visual anchor around which precise information can be composed.

Generated artwork should normally contain no text.

Do not ask the image generator to produce:

- titles;
- labels;
- numbers;
- statistics;
- legends;
- equations;
- UI-like cards;
- complete infographic layouts.

Generated imagery is an input to Infographic Studio, never the finished infographic.

Reserve useful negative space in generated artwork when the final composition needs labels or annotations around it.

### What stays editable

Keep the following in the Infographic Studio scene:

- titles;
- subtitles;
- labels;
- numbers and statistics;
- units;
- legends;
- annotations;
- callouts;
- connectors;
- precise geometry;
- source notes;
- equations;
- explanatory text.

Correcting any of these should not require regenerating the illustration.

## Visual composition principles

An infographic must communicate visually, not merely place a report inside rectangles.

Do not default to a grid of cards, boxes or repeated icon-and-text modules simply because they are easy to construct.

For general infographics, establish a clear visual anchor and build the information hierarchy around it.

Prefer compositions where the subject itself helps organize the explanation, for example:

- one dominant illustrated subject with surrounding annotations;
- an illustrated central system with supporting evidence;
- a physical or conceptual scene crossed by an explanatory sequence;
- an illustrated before/after relationship;
- an illustrated process with precise overlays;
- complementary illustrated panels when one visual cannot carry the thesis.

Cards, boxes and panels may support the composition, but they should not become the composition unless the content
genuinely requires that structure.

Do not convert every source fact into a separate visual block.

Use visual hierarchy to decide what deserves prominence. The audience should be able to identify the thesis and main
visual subject before reading the small text.

## Match the workflow to available capabilities

Check tool access and image viewing independently; do not infer either from the model name.

The free-placement scene is the general authoring surface. Use it for any composition that needs an intentional visual
hierarchy, such as an illustrated explanation, cutaway, physical mechanism, architecture, graph, comparison, timeline,
map, data display or annotated process. It supports arbitrary editable vector geometry, components, icons, local artwork
and anchored labels.

Use [infographic-format.md](references/infographic-format.md) when one of its named structures genuinely fits the
explanation.

Use [document-layout.md](references/document-layout.md) for its lower-level illustrated-object contract when a simple
process or bounded layered topology needs direct control.

Both are automatic sizing and routing shortcuts, never the default visual language and never substitutes for a
composition whose meaning depends on spatial design.

Read [capability-workflow.md](references/capability-workflow.md) for the free-placement JSON contract and correction
protocol.

- **No image generator:** use generic components, vector geometry or supplied local artwork. The renderer still exports
  the formats supported by the selected runtime. Keep one component family, palette and stroke system across figures.
- **No runtime access:** return a `document` specification for automatically sized illustrated objects, or `scene` and
  `placements` when physical geometry needs free placement. A trusted host can run `compose` and return findings. Never
  present an unexecuted specification as a rendered figure.
- **No image viewing:** run available checks and deliver a draft with visual review pending. If another reviewer
  inspects the export, record that separately. A zero-issue report does not establish visual quality.
- **Limited composition ability:** reserve separate label and artwork areas and route connections around both. Allow at
  most two self-correction rounds by default, retaining responses and feedback. If problems remain, report them and the
  next useful step instead of silently substituting another model's design. Honor a different user-requested iteration
  budget.

## From content to figure

1. **Understand the content.** Identify the message the figure must communicate, exact claims, quantities, labels,
   target language and final viewing size. For a documentation set, choose the few messages an audience should remember;
   do not make one figure for every heading. Use supplied references for visual direction; verify technical claims
   independently. Distinguish measured data from conceptual geometry.

2. **Establish art direction.** If the user supplied a reference or named a style, follow it. Otherwise choose an
   appropriate visual treatment from the content and intended use. Do not interrupt a normal infographic request merely
   to ask the user to choose a style when a reasonable art direction can be established from context.

3. **Write the composition brief.** Define the complete model, one thesis, the visible evidence needed to establish it,
   visual anchor, reading order, relationship geometry, panel count and why the proposed composition explains the
   subject. Select from any appropriate composition—cutaway, exploded view, layered system, graph neighborhood,
   before/after, sequence, timeline, map, chart or complementary panels. Do not force the brief into rows of icons or a
   stock flowchart. Do not map every source relationship to an arrow: keep one focused route where direction proves the
   thesis, use grouping or annotation for context, and use a detail figure when the full model is needed.

4. **Choose hybrid or vector-first.** Apply the default visual workflow above. General infographics use hybrid when
   image generation is available. Exact technical geometry, topology and quantitative figures use vector-first when
   appropriate.

5. **If hybrid, generate artwork now.** Do this before final scene composition.
   Read [illustration-workflow.md](references/illustration-workflow.md), generate the required text-free artwork,
   inspect it, save accepted PNG/JPEG files locally, record authentic provenance and reference those files as assets. Do
   not silently fall back to vector-only while continuing to call the workflow hybrid.

6. **Author the scene around the visual strategy.** Prefer a free `scene.json` for compositions whose meaning depends on
   intentional spatial design. Use semantic `document` layout only when it preserves the intended composition while
   removing routine object sizing and routing. Reuse generic components for common objects, primitives and paths for
   domain geometry, and local artwork for illustrated subjects. Preserve labels, numbers and formulas as editable scene
   text. Record content sources and asset provenance.

7. **Make containment explicit.** Reserve label and artwork regions, attach internal labels to their card or zone using
   `container`, and route connectors outside artwork and text bounds. Preserve component bounds metadata when editing,
   preferably by regenerating the component at its new position. This is design work, not a post-hoc cosmetic fix.

8. **Validate.** Run `infographic-studio check scene.json --strict`. Fix errors and applicable warnings. A passing check
   verifies mechanical properties, not scientific truth or visual quality.

9. **Render.** Run `infographic-studio render scene.json --out output --strict`. In portable mode, add
   `--formats svg,pdf`. Do not request PNG from the portable runtime.

10. **Review the actual output.** With image viewing available, inspect the rendered outputs at intended size. Check the
    reading order, visual anchor, relationship geometry, label/artwork collisions, leader and arrow paths, and whether
    all claims remain legible.

    For hybrid figures, explicitly verify that:
    - generated raster artwork is present in the final composition;
    - it provides the intended visual anchor or explanatory role;
    - editable overlays align with the correct visual features;
    - generated artwork and vector information behave as one coherent composition;
    - the result has not collapsed into a card grid around a decorative image.

    For a batch, inspect the figures together for repeated compositions.

    Adjust and rerender within the correction budget. Without image viewing, mark visual review pending. A non-strict
    preview used to diagnose warnings must be labeled as a draft.

11. **Deliver.** Deliver the editable scene, requested exports and any source images. State unresolved technical
    assumptions. When the user asks for a label correction, change that text element and rerender; preserve unrelated
    artwork. Do not regenerate artwork merely to correct editable text.

## Visual exploration

For visual exploration, keep a shared brief with the exact required claims and labels, then create genuinely different
compositions for that same content.

The repository's curated examples combine physical cutaways, material circuits, energy balances, staged transformations
and multiple architectural views. They demonstrate possible directions, not a mandatory house layout.

Use free scenes when domain geometry or visual composition carries the explanation.

Apply the text-hidden review in [composition-strategy.md](references/composition-strategy.md) before accepting an
illustrated explanation.

Use `framed: false` for open compositions and `callout` targets tied to stable object IDs for annotations that survive
movement.

Review leader endpoints after replacing an image: normalized anchors follow its box, not semantic features in new
artwork.

## Decisions that matter

- **General-purpose infographic or editorial explanation:** use hybrid by default when image generation is available.
  Generate meaningful artwork before final scene composition and use Infographic Studio for precise, editable
  information.

- **Geometry or data controls the meaning:** use deterministic paths and shapes, with values calculated from source data
  where applicable. Procedural waves are illustrative unless their parameters were derived from a model. Prefer
  vector-first when generated imagery would make technical relationships less precise.

- **Illustration carries the explanation:** use an available image-generation tool to create text-free artwork, then
  compose precise vector labels and annotations with Infographic Studio. The CLI's `assets` command writes prompts; it
  does not generate images or call APIs.

- **Both illustration and geometry matter:** use hybrid composition. Let generated artwork communicate appearance,
  physical context, texture or conceptual imagery, while deterministic geometry communicates relationships,
  measurements, flows and exact technical meaning.

- **Hybrid was selected but no generated asset exists:** the hybrid workflow is incomplete. Generate and incorporate
  suitable raster artwork, or explicitly reclassify the composition as vector-first if illustration is not useful.

- **The output looks like a repeated icon row or card grid:** do not decorate the same layout and call it finished.
  Revisit the composition brief. For a general infographic with image generation available, establish a meaningful
  illustrated visual anchor and reorganize the information around it.

- **The scene is too dense:** revisit the thesis and visual grammar before changing geometry. Move a second claim to a
  companion figure, re-encode contextual relationships with grouping or annotation, or increase the canvas only when the
  selected evidence truly needs more space. Do not shrink labels until they are unreadable.

- **A native editor format is requested:** use an available draw.io or other native tool and preserve its editable
  source. Do not claim this CLI exports `.drawio` files or automatically integrates third-party engines.

- **A tool or provider is unavailable:** use vector artwork if it preserves the requested result, or identify the
  missing capability. Do not silently replace an elaborate illustration with a generic flowchart.

The engine supports Latin, Greek and Cyrillic glyphs covered by its bundled Source Sans 3 fonts. Unsupported glyphs fail
validation rather than disappearing. Formula text supports Unicode symbols; it is not a LaTeX typesetter. Use a
typesetting tool and import its raster output only when that tradeoff meets the user's editability needs.