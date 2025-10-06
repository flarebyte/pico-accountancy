# Agents Index

This repository is template-driven. Prefer making documentation and
maintenance changes via baldrick-reserve templates and broth workflows rather
than editing files directly here.

-   Source of truth for docs/templates: `../baldrick-reserve`
    -   TS templates: `baldrick-reserve/template/ts/*.hbs`
    -   Scripts: `baldrick-reserve/script/*`
    -   Reserve model/schema: `baldrick-reserve/reserve-schema`
-   Project model and workflows: `baldrick-broth.yaml` in this repo
    -   Update metadata/links/highlights in `model.*` (readme, project info)
    -   Extend maintenance flows in `workflows.*`

Core docs (generated from templates): README, MAINTENANCE, TECHNICAL\_DESIGN,
CODE\_OF\_CONDUCT, CONTRIBUTING, DECISIONS.

## Write/Customize README via Broth

README is generated from `baldrick-broth.yaml` using the TS README template.

-   Render locally:
    -   `npx baldrick-whisker@latest render baldrick-broth.yaml
        github:flarebyte:baldrick-reserve:template/ts/readme.hbs README.md`
-   Populate `model.readme` in `baldrick-broth.yaml` to customize content.
    Optional fields:
    -   `summary`, `personas`, `valueProps`
    -   `images.hero`, `images.demo`
    -   `quickstart` (intro, steps, code), `useCases`
    -   `configuration.env[]`, `configuration.files[]`
    -   `cliExamples[]`, `apiExamples[]`
    -   `architecture.overview[]`, `architecture.diagram`
    -   `faq[]`, `troubleshooting[]`
-   Existing `highlights` and `cheatsheet` remain supported as fallbacks.

## Day-to-day Commands

-   Install: `yarn install`
-   Build: `yarn build`
-   Test: `yarn test` (node:test)
-   Coverage: `yarn test:cov` (c8 text-summary + lcov)
-   Lint/format (Biome): `npx @biomejs/biome check .` / `npx @biomejs/biome
    format . --write`
-   Broth alias: `npx baldrick-broth@latest <workflow> <task>`
    -   Full check: `npx baldrick-broth@latest test all`
    -   Examples: `npx baldrick-broth@latest test pest`

## Use Broth via npx

-   Preferred: `npx baldrick-broth@latest <workflow> <task> [options]`
-   Discover commands:
    -   List workflows: `npx baldrick-broth@latest --help`
    -   List tasks for a workflow: `npx baldrick-broth@latest <workflow> --help`
-   Common examples (mapped from `baldrick-broth.yaml`):
    -   Test: `npx baldrick-broth@latest test all` | `test coverage` | `test
        unit` | `test pest` | `test pest1` | `test scc` | `test cli`
    -   Lint: `npx baldrick-broth@latest lint check` | `lint fix`
    -   Docs: `npx baldrick-broth@latest doc ts`
    -   Markdown: `npx baldrick-broth@latest md check` | `md fix`
    -   Transpile: `npx baldrick-broth@latest transpile ts`
    -   Deps: `npx baldrick-broth@latest deps upgrade`
    -   GitHub: `npx baldrick-broth@latest github standard`
    -   Release: `npx baldrick-broth@latest release ready --pull-request` |
        `release pr` | `release publish`
    -   Scaffold: `npx baldrick-broth@latest scaffold norm` | `scaffold
        norm-package` | `scaffold upgrade` | `scaffold readme` | `scaffold
        custom`
-   Notes:
    -   Runs from repo root and reads `baldrick-broth.yaml` for
        workflows/tasks.
    -   Pin a version if needed: `npx baldrick-broth@0.20.0`.
    -   See also: `[Code Analysis](CODE_ANALYSIS.md)` and `[Agent
        Notes](AGENTS_PROJECT.md)`.
    -   Some tasks invoke external CLIs (e.g., `gh`, `typedoc`, Biome). Ensure
        they’re available and Node >= 22.
    -   Fallback to yarn only if needed: use `yarn cli` (TS dev), or `yarn
        build` then `node dist/src/cli.mjs`.

## Tooling Docs Quick Links

-   Baldrick tools (Flarebyte)
    -   Broth (this CLI): <https://github.com/flarebyte/baldrick-broth> • npm:
        <https://www.npmjs.com/package/baldrick-broth>
    -   Whisker (templating/render/object):
        <https://github.com/flarebyte/baldrick-whisker> • npm:
        <https://www.npmjs.com/package/baldrick-whisker>
    -   Pest (acceptance/spec runner):
        <https://github.com/flarebyte/baldrick-pest> • npm:
        <https://www.npmjs.com/package/baldrick-pest>
    -   Doc TS (typedoc/markdown):
        <https://github.com/flarebyte/baldrick-doc-ts>
        • npm: <https://www.npmjs.com/package/baldrick-doc-ts>
    -   Dev TS (markdown, release utils):
        <https://github.com/flarebyte/baldrick-dev-ts> • npm:
        <https://www.npmjs.com/package/baldrick-dev-ts>
    -   Reserve (templates + scripts + schema):
        <https://github.com/flarebyte/baldrick-reserve>
    -   Zest Mess (helpers used in docs/specs):
        <https://github.com/flarebyte/baldrick-zest-mess> • npm:
        <https://www.npmjs.com/package/baldrick-zest-mess>
-   Other tooling referenced
    -   Biome (lint/format): <https://biomejs.dev/> • npm:
        <https://www.npmjs.com/package/@biomejs/biome>
    -   TypeDoc: <https://typedoc.org/>
    -   GitHub CLI (`gh`): <https://cli.github.com/>
    -   scc (code counter): <https://github.com/boyter/scc>
    -   zx (shell scripts): <https://github.com/google/zx>

Tip: Browse all “baldrick-\*” packages

-   GitHub org search:
    <https://github.com/flarebyte?q=baldrick&type=repositories>
-   npm search: <https://www.npmjs.com/search?q=baldrick->

## Discover Tooling from Workflows

-   Find external tools used by tasks:
    -   `rg -n "npx " baldrick-broth.yaml`
    -   `rg -n "github:flarebyte:" baldrick-broth.yaml` (template/data sources)
-   Inspect a task’s help/links:
    -   `npx baldrick-broth@latest --help`
    -   `npx baldrick-broth@latest <workflow> --help`
-   Common tool invocations in this repo:
    -   Templates: `npx baldrick-whisker@latest render|object ...`
    -   Acceptance tests: `npx baldrick-pest@latest test --spec-file ...`
    -   Docs: `npx typedoc@latest ...` then `npx baldrick-doc-ts@latest ...`
    -   Lint/format: `npx @biomejs/biome check .` / `format . --write`
    -   Release/Repo: `gh repo edit ...`, `gh release create ...`

## Editing Code: Good Practices (Generic TS projects)

-   Prefer Broth workflows and templates
    -   For docs/config, change `baldrick-broth.yaml` and render via templates
        rather than editing generated files.
    -   Keep `AGENTS.md` generic; use project-specific notes file for local
        quirks.
-   Keep Node and tooling aligned
    -   Node: `>=22`. Local dev runner uses `tsx`; avoid `ts-node` loaders.
    -   Lint/format with Biome only: `npx @biomejs/biome check .` / `format . --write`.
-   Validate before commit
    -   Run: `npx baldrick-broth@latest test all` (lint, unit, pest, coverage).
    -   Ensure coverage runs via `yarn test:cov`; lcov is written to
        `coverage/lcov.info` (ignored).
    -   Completion cue (macOS): announce end of a task with `say done` or `say
        "your message done"`.
-   Don’t commit generated artifacts
    -   `dist/`, `coverage/`, and other build outputs should remain untracked.
-   Small, focused changes
    -   Match existing style; prefer minimal diffs and local fixes over wide
        refactors.
    -   Update or add unit tests alongside changes; prefer `node:test` + `tsx`.

## Project-specific Guidance

-   This file aims to be generic across TS projects.
-   Place repository-specific details (special tasks, one-off scripts,
    folder conventions) in `AGENTS_PROJECT.md` (agent-friendly companion).
-   If a project needs additional contributor-facing notes, consider a
    short `PROJECT_NOTES.md` that links to `AGENTS.md` and `INTERNAL.md`.
