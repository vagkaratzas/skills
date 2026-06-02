---
name: add-comments
description: >
  Use this skill when asked to write/update comments.
---

# Why and how to write code comments

## Why Write Comments
1. Comments capture **design decisions and intent** that code cannot express.
2. Comments are part of the abstraction — good interface docs mean users don't have to read the implementation.
3. Writing comments **early** exposes design problems before you invest in code.
4. Good comments dramatically reduce cognitive load.

## What Comments Should Describe
- **Non-obvious information**: the *why*, constraints, boundary conditions, side effects — things you can't see in the code.
- Comments should NOT repeat what the code already says. 🚩 Red Flag: Comment Repeats Code

## Comment Layers
- **Interface comments**: describe *what* and *why* — no implementation details.
- **Implementation comments**: explain *how* and *why this approach* — why the code is written this way.
- **Cross-module comments**: document design decisions and dependencies that span module boundaries.

## Comments-First Approach
- Write interface comments *before* writing the implementation — use comments as a design tool.
- If you can't write a clear comment, the design itself probably has a problem.