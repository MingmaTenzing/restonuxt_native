# Agent resources

This folder holds **Expo agent skills** — structured instructions agents read before implementing features in this project.

## Layout

```
.agents/
  README.md           ← you are here
  skills/
    README.md         ← skill catalog (when to use each skill)
    <skill-name>/
      SKILL.md        ← entry point — always read this first
      references/     ← optional deep-dive docs
      scripts/        ← optional helper scripts
```

Skills stay in **flat folders** under `skills/` so paths remain stable in `.cursor/rules/` and `AGENTS.md`.

## How agents should use skills

1. Check the task against [skills/README.md](./skills/README.md).
2. Open the matching `SKILL.md` and follow it completely.
3. Drill into `references/` only when the skill points you there.
4. Pair with **Expo MCP** (`user-expo`) and **`RESTOQUICK_DOC.md`** for this repo.

## Project-level instructions

Root [`AGENTS.md`](../AGENTS.md) covers commands, structure, and boundaries for this codebase.

Cursor also applies [`.cursor/rules/expo-first.mdc`](../.cursor/rules/expo-first.mdc) automatically.
