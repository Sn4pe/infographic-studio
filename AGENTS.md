# Contributing with an agent

This is a standalone, public composition engine. Keep runtime and examples independent of any company, agent host or proprietary content. Do not copy private tickets, credentials or the user's source screenshots into this repository.

Use Node.js 22+. Run `npm ci`, `npm test` and `npm run examples` after changes to rendering or layout. Inspect both example PNGs after visual changes. Keep SVG text editable and PNG/PDF output consistent with the scene.

The CLI has no paid API calls. Do not add provider calls behind `render`, `check` or `assets`. Image generation belongs to explicit host tools; the engine accepts local assets.

Keep README and contributor-facing documentation in English. Scene text may use any language supported by the bundled fonts. Never imply layout checks establish scientific correctness.

Publish only when requested. Do not update Jira or external trackers as part of repository work.
