---
name: writing-changelog
description: >
  Use when writing, updating, reviewing, or cleaning up a CHANGELOG.md, release notes, or an
  "unreleased" section, including before tagging or cutting a release. Do not trigger for
  commit messages, PR descriptions, or internal design/plan documents.
---

# Writing a Changelog

A changelog tells someone **coming from the previous release** what is different in this
one. Users first; contributors get an optional `Internal` section last. It is not a commit
log, a dev diary, or a record of how the work went.

## Workflow

1. Find the baseline: the last released version (`git describe --tags --abbrev=0`).
2. Gather what changed since it: `git log --oneline <tag>..HEAD` and
   `git diff --stat <tag>..HEAD`. Skip commits touching only tests, fixtures, CI, docs for
   contributors, or agent/plan files.
3. For every candidate entry ask: **would a user upgrading from `<tag>` notice this?** If
   not, would a contributor? Neither → delete it.
4. Collapse within-version churn, in every section including `Internal`. Anything added in
   this version has no baseline state, so its later changes vanish: a feature added and then
   fixed is one `Added` entry describing final behaviour; a fixture added and then
   regenerated is at most "added". A fix to a fix is one fix, stated against the baseline.
   Remove cross-references like "the entry below missed…".
5. Verify every fact against the current README, `--help`, or code — not the old changelog.

## Keep

- New or changed commands, flags, defaults, output files, formats, columns, exit codes.
- Changes to results, and a measured effect a user can check (e.g. "families shrink from 32
  to 31 members on the example data"). Note divergence from any reference implementation
  users compare against.
- Performance, memory, or resource-use changes users would feel.
- Dependency or runtime-version requirement changes.
- Migration: what a user must do differently, and when a deprecated option is removed.

## Cut

- Function, class, variable, test, and commit names; file paths of source code.
- How the fix works internally; benchmark micro-timings; review or planning history.
- Refactors, new tests or fixtures, lint, CI tweaks, agent/plan docs. A changed
  contributor workflow goes in `Internal`.
- Anything already listed in an earlier released version.

## Format

- Newest version first; `## [x.y.z] - YYYY-MM-DD`, or `## [Unreleased]` (keep the project's
  existing unreleased heading if it has one).
- Sections in this order, omitting empty ones: `Added`, `Changed`, `Deprecated`, `Removed`,
  `Fixed`, `Security`, `Internal`.
- Prefix incompatible changes with `**Breaking:**` and say what users must do.
- Deprecations name the replacement and the removal version.
- One entry per user-visible change. Lead with the effect, one to three sentences. Nested
  bullets only for a large feature's key options.
- Fixed entries say what users saw before and what happens now.
- Released versions: never add, remove, or re-date entries. Rewording for clarity is fine
  when asked; mention it in the reply.

## Internal

Optional, usually empty. One line each, only for differences a contributor or packager hits
coming from the previous release: changed test/build commands, changed documented helper
functions, changed contributor workflow, dropped platform support. Still never how a change
was implemented, test names, or fixtures and tests that are merely new — those live in git
history.

## Example

Bad — developer detail and within-version churn:

```markdown
- `extract_records` now sorts `hit.domains.reported` by score. Guard:
  `test_extract_records_puts_top_scoring_domain_first`.
- Retrying `_discarded.csv` writes was unsafe; the entry below fixed this for successful
  families in 2.1.0.dev0 but missed the discard branch.
- Internal: refreshed HMM library fixture checksums. (Fixture is new in this version.)
```

Good:

```markdown
- **Breaking:** the representative is now the highest-scoring domain of the top hit, not
  its leftmost domain. Output changes for families whose top hit has several domains.
- A failed output write could duplicate a `<chunk>_discarded.csv` row. The run now exits `1`.
```
