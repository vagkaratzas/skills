---
name: migrate-nf-core-static-types
description: |
  Use when migrating, or reviewing a PR that migrates, an nf-core / Nextflow pipeline to typed
  parameters or static types — e.g. "add parameter types", "typed params block", "strict typing",
  "nextflow.enable.types", "convert to records", bumping to Nextflow >= 26.04, or nf-core lint
  failing on nextflow_config / schema_params after moving params into main.nf.
---

# Migrating nf-core Pipelines to Static Types

Migration happens in two stages. Ship them as separate PRs:

1. **Typed parameters**: a typed `params {}` block in `main.nf`. This changes little and is safe to ship first.
2. **Full static types**: `nextflow.enable.types = true`, typed process and workflow I/O, and records. This is a large refactor.

Source: https://docs.seqera.io/nextflow/tutorials/static-types. Re-read it before starting, because the syntax is still changing.

## Stage 1: typed parameters

### Files to touch

| File | Change |
|---|---|
| `main.nf` | Add `params { name: Type = default }` above the entry `workflow {}`. Base it on `nextflow_schema.json` and reuse each property's description as a `//` comment. |
| `nextflow.config` | Keep **only** the params the config itself reads (see rule below). Delete the rest. Set `manifest.nextflowVersion = '!>=26.04.0'`. |
| `conf/modules.config` | Wrap every `ext.args`/`ext.prefix`/`ext.*` that reads `params.*` in a closure `{ ... }`. |
| `nextflow_schema.json` | Keep in sync. Add `"format": "file-path"` / `"directory-path"` for every `Path` param. |
| `subworkflows/local/utils_nfcore_<pipeline>_pipeline/main.nf` | Make helper functions (`validateInputParameters`, `genomeExistsError`, `getGenomeAttribute`, `toolCitationText`, …) take params as arguments instead of reading the global `params`. |
| `workflows/<pipeline>.nf` | Update the call sites of those helpers. |
| `.nf-core.yml` | Under `lint:`, set `nextflow_config: false` and `schema_params: false`, with a `# TODO` comment, until nf-core/tools supports typed params. Open a tracking issue. |
| `.github/workflows/nf-test.yml` | Set `NXF_VER` to `"26.04.0"` (quoted) and `"latest-everything"`. |
| `README.md`, `CHANGELOG.md` | Update the Nextflow badge. Add a changelog entry and list the Nextflow bump under Dependencies; it breaks users on older versions. |

`conf/test*.config` usually needs no change, because config-level param overrides still work.

### Where a param lives: one rule

**The config reads it at resolution time → it goes in `nextflow.config` only. Otherwise → it goes in the `main.nf` `params` block only.**

Params that belong in config:
- `outdir`, `publish_dir_mode`, `trace_report_suffix`, `monochrome_logs`
- `custom_config_*`, `config_profile_*`
- `genome`, `igenomes_base`, `igenomes_ignore`
- any param read eagerly in `publishDir` (`enabled: params.save_x`, `path:` without a closure)

Never declare a param in both places. The two defaults drift apart, and reviewers will flag it.

### Types

| Value | Type |
|---|---|
| file, directory, DB, remote URL to a file | `Path` (not `String`), with `format: file-path` / `directory-path` in the schema |
| optional with no default | `Type?`, e.g. `String?`, `Path?` |
| flag | `Boolean`. It defaults to `false` when no default is given. |
| integer / decimal | `Integer` / `Float`. Match the schema's `integer` / `number`. |
| size like `'25.MB'` | consider `MemoryUnit` |
| required input | `input: Path`, non-nullable with no default |

### Why `ext.args` needs closures

Without a closure, `ext.args` is evaluated at config time. Params declared only in the `main.nf` block have no value yet, so they render as `null` on default runs. CLI overrides still work, which hides the bug.

```groovy
// before
ext.args = "-k ${params.kmers}"
// after
ext.args = { "-k ${params.kmers}" }
```

## Stage 2: full static types

Only start this after Stage 1 is merged. Check the tutorial first for whether typed and legacy (nf-core/modules) processes can be mixed. Expect to migrate `modules/local`, `subworkflows/local` and `workflows/` first.

- Add `nextflow.enable.types = true` to every script that uses typed processes or workflows.
- Process inputs: `tuple val(meta), path(x)` becomes `record(id: String, x: Path)`, `path` becomes `Path`, and `val` becomes a concrete type. Use `Bag<Path>` for collections.
- Process outputs: use `file()`, `files()`, `stdout()`, `env()` and `eval()`, wrapped in `record(...)`.
- Define `record Sample { id: String; ... }` types. Give `take:` types (`ch: Channel<Sample>`) and give `emit:` typed assignments.
- Remove the forbidden patterns: `.out` (assign results instead), `.set{}` / `.tap{}`, the `|` / `&` dataflow operators, implicit `it`, `Channel.from` (use `channel.of`), and the `each` qualifier (use `combine()`).
- Stop reading `params.*` inside process scripts. Pass them as inputs or through `ext.args`.

Useful tools:
- `nextflow lint .` must pass before you start.
- The Nextflow language server reports type errors.
- The VS Code command "Convert script to static types" does most of the mechanical conversion.

## Review checklist

- [ ] `manifest.nextflowVersion` and CI `NXF_VER` are both `>= 26.04.0`.
- [ ] No param is declared in both `nextflow.config` and `main.nf`.
- [ ] Every param in the block exists in `nextflow_schema.json` with a matching type, and vice versa.
- [ ] Every file or directory param is `Path`, and its schema entry has `format`.
- [ ] Every `params.*` read in `conf/modules.config` is inside a closure, unless that param stays in config.
- [ ] Helper functions get params as arguments.
- [ ] The lint exclusions in `.nf-core.yml` have a TODO and a tracking issue.
- [ ] The default test profile **and** a run with no CLI flags both behave as before. Compare the `ext.args` in `.command.sh`.
- [ ] Stage 2 work is deferred to its own PR.
