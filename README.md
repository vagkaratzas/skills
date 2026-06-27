# Skills

Personal collection of agent skills for day-to-day use.

## Installation

### Claude Code

Install the full plugin from the marketplace:

```bash
claude plugin marketplace add vagkaratzas/skills
claude plugin install skills@vagkaratzas-skills
```

The marketplace registers as `vagkaratzas-skills`, so it can coexist with the `vagkaratzas` marketplace used by other repositories.

Then start a new session so Claude Code loads the skills.

### Codex

Codex can use the same marketplace repository. Add the marketplace, then install the plugin:

```bash
codex plugin marketplace add vagkaratzas/skills
codex plugin add skills@vagkaratzas-skills
```

Then start a new Codex session so the skills are available.

### Updating

Claude Code:

```bash
claude plugin marketplace update vagkaratzas-skills
claude plugin update skills@vagkaratzas-skills
```

Codex:

```bash
codex plugin marketplace upgrade vagkaratzas-skills
codex plugin remove skills@vagkaratzas-skills
codex plugin add skills@vagkaratzas-skills
```

### Reinstalling the Marketplace

Use this if the marketplace source itself changed or the local marketplace snapshot is stale.

Claude Code:

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

### One Skill Only

Plugin installs are bundle installs: installing this plugin copies every skill from this repo into the agent's skill set. The current Claude Code and Codex plugin commands do not expose a `--skill-name`-style flag for selecting one skill from a multi-skill plugin.

To install only one skill, either copy that skill directory manually from a local clone, or ask your agent to fetch only `skills/<name>/` from this repository and place it in your agent skills folder.

Manual copy from a local clone:

```bash
SKILL_NAME="<name>"
AGENT_SKILLS_DIR="$HOME/.claude/skills"  # or ~/.codex/skills, ~/.agents/skills

mkdir -p "$AGENT_SKILLS_DIR"
cp -r "skills/$SKILL_NAME" "$AGENT_SKILLS_DIR/"
```

Fetch a single skill without cloning the repo:

```bash
SKILL_NAME="<name>"
AGENT_SKILLS_DIR="$HOME/.claude/skills"  # or ~/.codex/skills, ~/.agents/skills

mkdir -p "$AGENT_SKILLS_DIR/$SKILL_NAME"

curl -fsSL \
  "https://raw.githubusercontent.com/vagkaratzas/skills/main/skills/$SKILL_NAME/SKILL.md" \
  -o "$AGENT_SKILLS_DIR/$SKILL_NAME/SKILL.md"
```

If the skill has bundled files, create the same subdirectories locally and fetch each file by its repo path. For example:

```bash
mkdir -p "$AGENT_SKILLS_DIR/$SKILL_NAME/references"

curl -fsSL \
  "https://raw.githubusercontent.com/vagkaratzas/skills/main/skills/$SKILL_NAME/references/<file>.md" \
  -o "$AGENT_SKILLS_DIR/$SKILL_NAME/references/<file>.md"
```

Skill paths live under `skills/<name>/` in this repo, not at the repository root. There is no bulk single-directory download over `raw.githubusercontent.com`; use one `curl` per file, copy from a local clone, or ask an agent to fetch the skill directory for you. Start a new agent session after installation so the skill is loaded.

---

## Skills

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
