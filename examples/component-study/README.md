# Generic component comparison

Open [compare.html](compare.html) and switch between previous figures, shared components or both. The five source examples are preserved. SVG, PNG and PDF exports are available in each derived example's `rendered` directory.

Rebuild from the repository root with `npm run study:components`. This replaces derived study files only. Comparison reports record component usage and preservation checks.

The sensing example reuses device housings at two sizes, plants and a grid. The optics and fibre examples reuse section geometry with the existing material boundaries and callout IDs. Rays, equations, signal curves and spectral colours retain their original meaning. Two line weights still distinguish raw and smoothed signals.

The hybrid example retains the original raster bytes. Its three-dimensional perspective and shading are deliberately visible in the comparison; changing the surrounding vector components does not make the raster comply with the profile. Scientific correctness and communication quality require human review.
