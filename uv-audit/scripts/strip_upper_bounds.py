#!/usr/bin/env python3
"""Remove upper-bound version constraints from user dependency sections in pyproject.toml.

Targets only [project].dependencies, [project.optional-dependencies.*],
[dependency-groups.*], and [tool.uv] — leaves requires-python, build-system
requires, and all other fields untouched.

Package name strings start with [A-Za-z0-9], so version-only strings like
">=3.8" are never matched.

Usage:
    python strip_upper_bounds.py [path/to/pyproject.toml]
    (defaults to pyproject.toml in the current directory)
"""

import re
import sys
from pathlib import Path

SAFE_SECTIONS = (
    "[project]",
    "[project.optional-dependencies",
    "[dependency-groups]",
    "[tool.uv]",
)


def strip(toml_path: Path) -> None:
    lines = toml_path.read_text().splitlines()
    in_safe = False
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith("["):
            in_safe = any(s.startswith(sec) for sec in SAFE_SECTIONS)
        if in_safe:
            line = re.sub(r'("[A-Za-z0-9][^"]*),\s*<[^"]+', r"\1", line)
        out.append(line)
    toml_path.write_text("\n".join(out) + "\n")
    print(f"Stripped upper-bound constraints from {toml_path}")


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("pyproject.toml")
    if not path.exists():
        print(f"Error: {path} not found", file=sys.stderr)
        sys.exit(1)
    strip(path)
