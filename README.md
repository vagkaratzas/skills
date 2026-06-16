# Skills

Personal collection of agent skills for day-to-day use.

## Installation

### Claude Code

Install the full plugin from the marketplace:

```bash
claude plugin marketplace add vagkaratzas/skills
claude plugin install skills@vagkaratzas
```

Then start a new session so Claude Code loads the skills.

### Codex

Codex can use the same marketplace repository. Add the marketplace, then install the plugin:

```bash
codex plugin marketplace add vagkaratzas/skills
codex plugin add skills@vagkaratzas
```

Then start a new Codex session so the skills are available.

### One Skill Only

Plugin installs are bundle installs; the current Claude Code and Codex plugin commands do not expose a `--token-saviour`-style flag for selecting one skill from a multi-skill plugin.

To install only one skill, copy that skill directory directly into your agent skills folder. For example, to install only `token-saviour`:

```bash
cp -r skills/token-saviour ~/.agents/skills/
```

For Claude Code only:

```bash
cp -r skills/token-saviour ~/.claude/skills/
```

For Codex only:

```bash
cp -r skills/token-saviour ~/.codex/skills/
```

Then use the skill naturally in conversation. Each skill's description tells the agentic platform when to trigger it automatically.

---

## Skills

### [token-saviour](skills/token-saviour/)
Helps agents pick the most token-efficient tool for codebase exploration, symbol lookup, verbose command output, and long prose responses. Routes work to serena, graphify, rtk, caveman, or plain shell tools based on where tokens are actually being spent.

**Triggers on:** "save tokens", "use fewer tokens", "explain this codebase", "find callers", "trace this call path", verbose tests, builds, git output, or grep/listing output.

Based on [this](https://github.com/vagkaratzas/token-consumption-benchmark) Claude Code (Opus 4.8 + ultracode) benchmark.

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

## License

[MIT](LICENSE)
