# Composition strategy

Use this reasoning before authoring **every** figure, regardless of whether the subject is a physical mechanism, a scientific explanation, a process, a comparison, a topology or a software architecture. It prevents a complete source model from being mistaken for a readable visual explanation.

## Separate the model from the figure

Record three things in the composition brief:

1. **Model:** the claims, objects, measurements and relationships that are true or relevant.
2. **Thesis:** the one conclusion a reader should take away from this figure.
3. **Visible evidence:** the minimum objects, relationships and annotations that let a reader verify that conclusion at the intended size.

The model may be richer than one figure. Preserve it in the source notes or semantic input, but do not render every fact with equal visual weight. A figure can be complete as an explanation while deliberately omitting secondary relationships from its visible marks.

## Choose a grammar before drawing

Choose the spatial grammar that makes the thesis apparent. Do not begin by placing every named object in a grid.

| Thesis is about | Suitable grammar | Primary visual evidence |
| --- | --- | --- |
| How a physical effect happens | Cutaway, cross-section, ray/field path, before/after | Material boundaries, direction and annotated causal path |
| How a value changes | Chart, scale, small multiples, annotated curve | Axes or comparative scale, selected observations |
| What differs between alternatives | Comparison, split view, aligned before/after | Shared baseline and matched categories |
| What happens over time | Sequence, timeline, staged transformation | One ordered path and stage transitions |
| What contains or governs what | Hierarchy, layered system, nested regions | Containment and a few directional dependencies |
| How a system works end-to-end | Overview with a focused journey | One continuous route; surrounding components provide context |
| How a local network behaves | Neighborhood or detail view | Relevant links near the focal node, with a bounded scope |

Use complementary panels when a second thesis is necessary. Do not turn an overview into a detail view by adding more arrows, labels or miniature cards.

## Treat relationships as visual claims

A connector must answer a reader's question: cause, transfer, order, containment, dependency or comparison. It is not a default decoration for every relation in the model.

- Draw a direct arrow only when direction is necessary for the thesis.
- Use enclosure, alignment, proximity, shared color, a legend or a callout when they communicate the relationship more clearly than an arrow.
- Give one relationship class one visual treatment. Do not mix protocols, dependencies, data flow and control flow on indistinguishable arrows.
- For a focused journey, make the main route easy to follow. Preserve branches, return paths and parallel actors when they are necessary to the explanation; a single chain is a choice, not a universal constraint.
- Use complementary views when control, material flow, ownership or a feedback loop would compete on one canvas. Keep identities and the meaning of colours consistent across those views.

This applies equally to a ray entering glass, a causal chain in a scientific explanation, a product funnel and a distributed system. The geometry changes; the model-to-thesis decision does not.

## Review the composition, not only the layout

Before rendering, ask whether the focal element is evident, whether the reading order follows the thesis without consulting a legend, and whether each visible mark earns its space. During visual review, remove or re-encode marks that compete with the conclusion even if they pass collision and containment checks.

For an illustrated explanation, apply a **text-hidden review**: would the drawing still reveal a mechanism, transformation, spatial organisation or quantitative comparison if the paragraphs were hidden? If all that remains is interchangeable rectangles and arrows, the prose is doing the work. Draw the relevant geometry, material boundaries, intermediate states, nesting or scale before adding more text. This test does not apply literally to inherently symbolic formats such as ERDs or text tables.

Complexity should add explanatory evidence. A physical cycle can show phase changes and energy exchange; a deployment can show the object changing shape; an architecture can show resource ownership, runtime containment and a separate data path. Match the evidence to the subject rather than adding a fixed number of panels or decorative icons. Shared typography and colour roles give a series consistency even when each composition is different.
