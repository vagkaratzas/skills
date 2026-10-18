# Skills

Personal collection of agent skills for day-to-day use.

## Installation

This repo is a grab bag of unrelated skills (nf-core, Python, writing, tooling). **Copy only the skills you want**; don't install the whole repo as a plugin. Every installed skill adds its description to the agent's context, and a skill that fires on the wrong task costs tokens and can steer the agent off course.

Browse [Skills](#skills) below, pick one, and copy its directory into your agent's skills folder. Then start a new agent session so it loads.

### Copy one skill (recommended)

Without cloning. This fetches the whole skill directory, bundled `scripts/` and `references/` included:

```bash
SKILL_NAME="<name>"                      # e.g. using-depictio-nf-core
AGENT_SKILLS_DIR="$HOME/.claude/skills"  # or ~/.codex/skills, ~/.agents/skills

mkdir -p "$AGENT_SKILLS_DIR"
curl -fsSL https://github.com/vagkaratzas/skills/archive/refs/heads/main.tar.gz \
  | tar -xz -C "$AGENT_SKILLS_DIR" --strip-components=2 "skills-main/skills/$SKILL_NAME"
```

From a local clone:

```bash
cp -r "skills/$SKILL_NAME" "$AGENT_SKILLS_DIR/"
```

Or ask your agent to fetch `skills/<name>/` from this repository into your skills folder.

To update a skill, run the same command again. To remove one, delete its directory.

### Whole repo as a plugin (not recommended)

This installs **every** skill in the repo. Use it only if you really want them all.

<details>
<summary>Claude Code and Codex plugin commands</summary>

Claude Code:

```bash
claude plugin marketplace add vagkaratzas/skills
claude plugin install skills@vagkaratzas-skills
```

The marketplace registers as `vagkaratzas-skills`, so it can coexist with the `vagkaratzas` marketplace used by other repositories.

Codex:

```bash
codex plugin marketplace add vagkaratzas/skills
codex plugin add skills@vagkaratzas-skills
```

Update, Claude Code:

```bash
claude plugin marketplace update vagkaratzas-skills
claude plugin update skills@vagkaratzas-skills
```

Update, Codex:

```bash
codex plugin marketplace upgrade vagkaratzas-skills
codex plugin remove skills@vagkaratzas-skills
codex plugin add skills@vagkaratzas-skills
```

Reinstall, if the marketplace source changed or the local snapshot is stale. Claude Code:

```bash
claude plugin remove skills@vagkaratzas-skills
claude plugin marketplace remove vagkaratzas-skills
claude plugin marketplace add vagkaratzas/skills
claude plugin install skills@vagkaratzas-skills
```

Codex:

```bash
codex plugin remove skills@vagkaratzas-skills
codex plugin marketplace remove vagkaratzas-skills
codex plugin marketplace add vagkaratzas/skills
codex plugin add skills@vagkaratzas-skills
```

Plugin installs are bundle installs: neither CLI can pick a single skill from a multi-skill plugin.

</details>

---

## Skills

### [drawio-nf-core-metromaps](skills/drawio-nf-core-metromaps/)
Draws, updates and exports nf-core / Nextflow pipeline metro maps in draw.io (app.diagrams.net) through Claude in Chrome. A browser helper library builds the map from a spec: parallel lanes per run mode, solid lanes for per-sample steps and dotted ones for per-family steps, nf-core module stations, and arrows snapped onto dashes. It exports light and dark PNG/SVG, swapping the logo only in memory, and an installer drops them into `docs/images`. Records the approaches that failed (Drive connector, localhost relay, script-only downloads, dark-mode colour inversion) so they are not tried again.

**Triggers on:** "update the metro map", "redraw the workflow diagram", "export the metromap light/dark", editing a draw.io pipeline diagram. Not for Inkscape or nf-metro maps.

---

### [migrate-nf-core-static-types](skills/migrate-nf-core-static-types/)
Guides migrating (or reviewing a migration of) an nf-core / Nextflow pipeline to static types in two stages: typed `params {}` block first (what stays in `nextflow.config`, `ext.args` closures, `Path` vs `String`, schema sync, lint exclusions, Nextflow >= 26.04), then full static types (`nextflow.enable.types`, records, typed process/workflow I/O). Ends with a PR review checklist.

**Triggers on:** "add parameter types", "typed params block", "strict typing", "migrate to static types", "nextflow.enable.types", reviewing a parameter-types PR.

Based on the [Nextflow static types tutorial](https://docs.seqera.io/nextflow/tutorials/static-types).

---

### [plan-nf-core-releases](skills/plan-nf-core-releases/)
Creates and revises a `ROADMAP.md` for nf-core / Nextflow pipelines: maps open GitHub issues, PRs, and the maintainer's agenda onto small single-theme releases under a changed-files budget (default < 100), batches breaking changes into one major, lists nf-core/modules and test-datasets work as external gates, verifies nf-core rules and param-naming conventions against source, and keeps traceability tables plus a dated decisions log.

**Triggers on:** "create a release roadmap", "plan the next releases", "what goes into v3.0.0", "split this feature across releases", "update the roadmap". Does not trigger for changelogs or cutting a release.

---

### [redesign](skills/redesign/)
Guides explicit code redesign requests using John Ousterhout-inspired design principles: reduce complexity, make modules deeper, hide information, simplify interfaces, pull complexity downward, and improve error semantics while preserving behavior.

**Triggers on:** "$redesign", "redesign this code", "redesign this module", "redesign this API". Does not trigger for ordinary review, refactoring, cleanup, or comment-writing requests.

Adapted from [luoling8192/software-design-philosophy-skill](https://github.com/luoling8192/software-design-philosophy-skill), with comment-writing guidance omitted.

---

### [token-saviour](skills/token-saviour/)
Helps agents pick the most token-efficient tool for codebase exploration, symbol lookup, verbose command output, and long prose responses. Routes work to serena, graphify, rtk, caveman, or plain shell tools based on where tokens are actually being spent.

**Triggers on:** "save tokens", "use fewer tokens", "explain this codebase", "find callers", "trace this call path", verbose tests, builds, git output, or grep/listing output.

Based on [this](https://github.com/vagkaratzas/token-consumption-benchmark) Claude Code (Opus 4.8 + ultracode) benchmark.

---

### [using-depictio-nf-core](skills/using-depictio-nf-core/)
Turns nf-core pipeline results into interactive [Depictio](https://github.com/depictio/depictio) dashboards. Depictio runs locally as a Python package, with no Docker. The skill covers finding the shipped template for a pipeline version and its variables, passing the samplesheet the pipeline doesn't publish, dry-running then ingesting, and refreshing or extending projects after new runs. For maintainers, it covers what breaks when the output layout changes, drafting a template with `template compose`, contributing one upstream, and auto-ingesting runs from Nextflow. It also lists the common failures: old Python, missing samplesheet, disabled 3D-structure panel, ignored env vars, and shared login nodes.

**Triggers on:** "make a Depictio dashboard for my results", "depictio ingest", "is there a Depictio template for <pipeline>", "dashboard tabs are empty", "update the Depictio template for the new release".

---

### [uv-audit](skills/uv-audit/)
Audits a Python project's dependencies for security vulnerabilities and outdated packages with uv, updates everything to the latest safe versions, runs the test suite before and after, and writes an `audit_report_YYYY-MM-DD.md`. Handles upper-bound constraints, auto-generates smoke tests if none exist, and reports conflicts it couldn't resolve.

**Triggers on:** "audit my dependencies", "check for CVEs", "update packages", "pip-audit", "outdated dependencies", dependency hygiene questions.

---

### [write-comments](skills/write-comments/)
Guides comment-writing based on John Ousterhout's *A Philosophy of Software Design*: comments should explain *why*, not *what*. Covers module-level, function-level, and inline comments. Pushes back on the "good code doesn't need comments" misconception.

**Triggers on:** "write comments", "add documentation", "review comments", "self-documenting code".

Adapted from [luoling8192/software-design-philosophy-skill](https://github.com/luoling8192/software-design-philosophy-skill).

---

### [write-nextflow-local-modules](skills/write-nextflow-local-modules/)
Creates or updates local Nextflow modules (`modules/local/<name>/`) for any pipeline. Follows nf-core module conventions loosely — no nf-core lint required, uses local test fixtures, and emits the modern topic-channel version output.

**Triggers on:** "add a module for X", "write a module that does Y", "create a Nextflow module", "update a local module".

---

### [writing-changelog](skills/writing-changelog/)
Writes and cleans up `CHANGELOG.md` for people coming from the previous release: only changes visible since the last tag, within-version churn collapsed into final behaviour, implementation detail (function/test names, internals, refactors, new fixtures) cut. Users first; contributor-facing differences go in an optional `Internal` section last. Follows Keep a Changelog section order with `**Breaking:**` and deprecation-removal markers.

**Triggers on:** "update the changelog", "write release notes", "clean up CHANGELOG.md", preparing a release. Does not trigger for commit messages or PR descriptions.

---

## License

[MIT](LICENSE)
