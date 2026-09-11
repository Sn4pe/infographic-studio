# Releasing

The initial release line is experimental. Use an annotated prerelease tag such as `v0.1.0-alpha.1`; do not present it as a stable release.

## Prepare locally

1. Set the same version in `package.json`, the root entries in `package-lock.json`, `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json`.
2. Update `CHANGELOG.md` and the README version and limitations.
3. Run `npm ci`, `npm test`, `npm run examples` and `npm run verify:package`. Inspect affected PNG and PDF exports. The package check uses an isolated installation and never publishes.
4. Review the staged files, licenses, provenance and documentation links. Keep private examples and evaluation logs outside the repository.
5. Commit the reviewed changes and create the annotated tag on that commit. Verify a clean working tree with `git status --short`.

## Publish when ready

Local commits and tags do not publish the repository. The maintainer controls the remote, visibility and release separately.

After the intended GitHub remote is configured, push `main` and the specific reviewed tag. Wait for the Windows and Linux CI jobs to pass on that revision. Create a GitHub release marked **prerelease**, using the corresponding changelog entry. Verify that the README images and relative links work on GitHub.

Publishing to npm is optional and separate from making the source public. Verify ownership of the package scope and inspect the packed files before publishing. If an alpha is published to npm, use the `alpha` distribution tag rather than `latest`.

Do not move a published tag to a different commit; prepare a new version for subsequent changes.
