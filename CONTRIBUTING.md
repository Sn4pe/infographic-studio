# Contributing

Use Node.js 22 or later and npm with the committed lockfile.

```sh
npm ci
npm test
npm run examples
npm run verify:package
```

Keep the engine and examples independent of any company or agent host. Use public or original material, record sources and retain third-party license notices. Keep documentation in English; figure labels may use any supported language.

For changes to rendering or layout, inspect the actual PNG and PDF exports at their intended viewing size. Add tests for observable behavior or regressions. Passing mechanical checks does not approve a figure's content.

Runtime code belongs in `src/`, schemas in `schema/`, reusable instructions in `skills/` and reproducible example builders in `scripts/`. Preserve stable IDs and editable text. Keep network and model-provider calls out of rendering and validation.

Describe the problem, resulting behavior and validation in a contribution. Include a before/after export when the visual output changes. Do not include private project data, credentials or local model-trial logs.
