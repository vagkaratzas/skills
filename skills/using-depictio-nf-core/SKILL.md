---
name: using-depictio-nf-core
description: >
  Use when turning nf-core / Nextflow pipeline results into interactive Depictio dashboards: installing
  or starting Depictio locally, running `depictio ingest` on an outdir, picking a template or its
  variables (samplesheet, GROUP_COL), checking whether a pipeline version has a Depictio template,
  fixing a blank or failing dashboard, auto-ingesting runs from Nextflow, or adding/updating a
  pipeline template after its output layout changed.
---

# Depictio dashboards for nf-core results

[Depictio](https://github.com/depictio/depictio) ships one template per nf-core pipeline version
(`nf-core/<pipeline>/<version>`): scan rules for the outdir, recipes that reshape outputs into tables,
and a ready dashboard. `depictio ingest <outdir>` detects pipeline + version from `pipeline_info/`
and builds the project. Fastest path for one person: the Python package with `depictio local up`
(no Docker). Docs: https://depictio.github.io/depictio-docs/latest/

## Quick reference

| Task | Command |
|---|---|
| Install (Python 3.11–3.14) | `uv tool install --python 3.12 "depictio[local]"` |
| Start server (127.0.0.1:8058) | `depictio local up --examples none` |
| Validate, change nothing | `depictio ingest <outdir> --dry-run --var ...` |
| Ingest | `depictio ingest <outdir> --var METADATA_FILE=$PWD/samplesheet.csv` |
| Refresh after a re-run | same command + `--update-config` (keeps viewer edits) |
| Add another outdir to the project | `... --attach-run` |
| Open / status / stop | `depictio local open` / `status` / `down` |
| No template for the pipeline | `depictio template compose <outdir> -o <dir>` |
| Delete all local data | `depictio local wipe --yes` |

## Steps

1. **Install.** `uv tool install` puts `depictio` on PATH in its own env (~1.6 GB). Python < 3.11
   fails; `--python 3.12` lets uv fetch one without touching conda. Prefer it over `uvx` (no
   `depictio` command left for `status`/`down`).
2. **Find the template and its variables.** Shipped templates live in the installed package:
   ```bash
   T=$(echo "$(uv tool dir)"/depictio/lib/python3.*/site-packages/depictio/projects/nf-core/<pipeline>)
   ls "$T"                                           # versions shipped
   sed -n '/variables:/,/^  reference:/p' "$T"/<version>/template.yaml
   ```
   Per-tab docs (optional inputs, env flags) are only on GitHub:
   `depictio/projects/nf-core/<pipeline>/<version>/docs/dashboards.md`.
   No exact version → the closest older one is auto-selected (log line `Auto-selected template:`).
   Run older than every shipped version, or wrong pick → pass `--template nf-core/<pipeline>/<version>`.
3. **Start the server.** First `up` downloads MongoDB, Redis, SeaweedFS (~170 MB, a few minutes)
   into `~/.depictio/local`; later starts take seconds. Env flags must be set on `up` itself (see
   Common mistakes).
4. **Provide the samplesheet.** nf-core pipelines don't publish `--input`. Templates read it from a
   variable (name differs per template: `METADATA_FILE`, `SAMPLESHEET_FILE`, ...), default usually
   `<outdir>/input/samplesheet.csv`. If `--input` was a URL, get it from
   `pipeline_info/params_*.json` and download it. Either pass `--var NAME=/abs/path` or copy it
   into `<outdir>/input/samplesheet.csv`.
5. **Dry-run, then ingest.** The dry-run resolves the template, prints the variables and lists
   collections whose sources are missing (`! Sources not found`); fix those first. Ingest prints
   project + dashboard URLs. Open one and check every tab has data.

## Pipeline maintainers

- **Output layout changed** (renamed/moved publish dirs, new major): template scan regexes stop
  matching and tabs go empty. Read `template.yaml`, run `--dry-run` + a real ingest on your new
  test output, then open a PR adding `depictio/projects/nf-core/<pipeline>/<new-version>/`. Guide:
  https://depictio.github.io/depictio-docs/latest/developer/contributing-templates/
  Recipes in `<pipeline>/recipes/` are shared across versions; add a per-version override only
  when a file's schema changed.
- **No template yet:** `depictio template compose <outdir> -o <dir>` builds one from the generic
  tool catalog (MultiQC, FAMSA, HMMER, SeqKit, ...). Treat it as a draft: it can mislabel
  pipeline-specific files as other pipelines' outputs and drops collections it can't resolve
  (listed under `Left out`). Edit, then `depictio ingest <outdir> --template <dir>`.
- **Auto-ingest every finished run:** `depictio config nextflow --install` adds an `onComplete`
  handler to `~/.nextflow/config` (failed runs are never ingested). One run only:
  `nextflow run ... -c $(depictio config nextflow)`.

## Common mistakes

| Symptom | Cause / fix |
|---|---|
| Install fails / no matching version | Python < 3.11 (e.g. conda base 3.10); `uv tool install --python 3.12 ...` |
| Dry-run: `! Sources not found ... input/samplesheet.csv` | Samplesheet not given; step 4. Ingesting anyway leaves the sample hub empty |
| Tabs empty after a pipeline update | Output paths no longer match template; maintainer section |
| 3D structure tile: "Structure lookup is disabled" | Restart: `depictio local down`, then `DEPICTIO_STRUCTURE_RESOLVER_ENABLED=true depictio local up`. Sends sequences/accessions to public ESMFold / AlphaFold DB / UniProt; ESMFold folds ≤ 400 aa |
| Other `DEPICTIO_*` vars ignored | `local up` drops shell `DEPICTIO_*` except `TELEMETRY_`, `VERSION_CHECK_`, `REMOTE_`, `FASTAPI_EMBED_`, `STRUCTURE_RESOLVER_` |
| `✗ Project '...' already exists on this server` | Same outdir: `--update-config`. Another outdir of the same study: `--attach-run`. Separate project: `--project "<name>"` |
| Logs | `~/.depictio/local/logs/` (api.log, worker.log) |

**Shared machines:** the local server is single-user with no login. On an HPC login node every
user of that node can reach its port. Use Docker Compose in multi-user mode there
(https://depictio.github.io/depictio-docs/latest/installation/docker/).
