# Skills

Personal collection of agent skills for day-to-day use.

## Installation

Copy any skill directory into your agentic platform skills folder:

```bash
cp -r <skill-name> ~/.agents/skills/
```

Then use it naturally in conversation — each skill's description tells the agentic platform when to trigger it automatically.

---

## Skills

### [token-saviour](token-saviour/)
Helps agents pick the most token-efficient tool for codebase exploration, symbol lookup, verbose command output, and long prose responses. Routes work to serena, graphify, rtk, caveman, or plain shell tools based on where tokens are actually being spent.

**Triggers on:** "save tokens", "use fewer tokens", "explain this codebase", "find callers", "trace this call path", verbose tests, builds, git output, or grep/listing output.

Based on [this](https://github.com/vagkaratzas/token-consumption-benchmark) Claude Code (Opus 4.8 + ultracode) benchmark.

---

### [uv-audit](uv-audit/)
Audits a Python project's dependencies for security vulnerabilities and outdated packages with uv, updates everything to the latest safe versions, runs the test suite before and after, and writes an `audit_report_YYYY-MM-DD.md`. Handles upper-bound constraints, auto-generates smoke tests if none exist, and reports conflicts it couldn't resolve.

**Triggers on:** "audit my dependencies", "check for CVEs", "update packages", "pip-audit", "outdated dependencies", dependency hygiene questions.

---

### [write-comments](write-comments/)
Guides comment-writing based on John Ousterhout's *A Philosophy of Software Design*: comments should explain *why*, not *what*. Covers module-level, function-level, and inline comments. Pushes back on the "good code doesn't need comments" misconception.

**Triggers on:** "write comments", "add documentation", "review comments", "self-documenting code".

Adapted from [luoling8192/software-design-philosophy-skill](https://github.com/luoling8192/software-design-philosophy-skill).

---

### [write-nextflow-local-modules](write-nextflow-local-modules/)
Creates or updates local Nextflow modules (`modules/local/<name>/`) for any pipeline. Follows nf-core module conventions loosely — no nf-core lint required, uses local test fixtures, and emits the modern topic-channel version output.

**Triggers on:** "add a module for X", "write a module that does Y", "create a Nextflow module", "update a local module".

---

## License

[MIT](LICENSE)
