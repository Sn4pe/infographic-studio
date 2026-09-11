# Changelog

## 0.1.0-alpha.3 — 2026-09-11

### Fixed

- Renamed the top-level `bin/` directory to `cli/`. claude.ai-hosted plugin installs reject a top-level `bin/`, since it is added to PATH on the CLI without going through the admin approval surface.

## 0.1.0-alpha.2 — 2026-09-11

### Added

- A marketplace manifest, so the repository installs directly as a Claude Code plugin.
- A first-use dependency bootstrap in the skill, since plugin hosts clone the repository without installing npm dependencies.

### Known limitations

- Carried over from 0.1.0-alpha.1, except that Claude Code plugin installation is now supported. AgentOS deployment remains unverified.

## 0.1.0-alpha.1 — 2026-09-11

First experimental release of the standalone composition engine and reusable agent skill.

### Included

- Offline SVG, PNG and PDF exports with editable vector text and embedded assets.
- Versioned scene and document schemas, CLI and JavaScript API.
- Automatic sizing and orthogonal routing for illustrated objects in rows, columns, grids and four-object cycles.
- Generic vector components, an Editorial flat illustration family, 17 Tabler icons and bundled Source Sans 3 fonts.
- Anchored callouts, label revision, print-size checks and geometric collision reports.
- Scientific and engineering examples, including a hybrid illustration with recorded generation provenance.
- A capability-aware skill and plugin manifests for Codex and Claude Code.

### Known limitations

- This is an alpha: APIs and document layout may change. Host plugin installation and AgentOS deployment have not been verified end to end.
- Models can produce incorrect relationships or overfill a fixed canvas. Checks do not verify facts; content and visual review remain required.
- Automatic relationships stay within one section and have no edge labels. Dense graphs can share routes or have crossings. There is no automatic pagination.
- Collision checks do not cover all curved paths, rotations, raster transparency or arrowhead outlines.
- The font coverage is limited to supported Latin, Greek and Cyrillic characters. LaTeX and native draw.io import/export are not implemented.
- Image generation is supplied by the host, not by the engine. The engine never calls a model provider.
