---
name: ai-os-wiki
description: Use when the user asks to connect the current project to the Obsidian AI OS Wiki, initialize project wiki docs, create AI OS pointer files, or mentions /ai-os-wiki.
---

# AI OS Wiki

Connect the current project to the user's Obsidian AI OS Wiki with the existing `ai-os-wiki-cli`.

## Default Workflow

1. Inspect the current project root and existing `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `.ai-os/CODEX.md`, and `.gitignore` files.
2. Prefer the local CLI when available:

   ```bash
   ai-os setup
   ```

3. If `ai-os` is not installed, use the GitHub package:

   ```bash
   npx github:littleduck1219/ai-os-wiki-cli setup
   ```

4. If the vault path is missing, ask the user for the Obsidian vault path or tell them to run:

   ```bash
   npx github:littleduck1219/ai-os-wiki-cli config set-vault --vault "/path/to/vault"
   ```

5. Do not overwrite team-owned `AGENTS.md`, `CLAUDE.md`, or `CODEX.md`. If those files already contain unrelated project rules, keep the AI OS pointer in `.ai-os/CODEX.md` and make sure `.ai-os/` is ignored.
6. After connecting, read the generated pointer and verify these docs exist:
   - project root
   - Active Context
   - Runbook
   - Session Brief
   - Decision Log
   - Work Records
   - Follow-ups
   - Issue Map

## Follow-up Initialization

If the generated Runbook still contains blanks or placeholders, inspect the real project files and update only the Obsidian wiki documents unless the user asked for code changes.

## Output

Keep the final response short:

- state which command ran
- state where the project wiki was created
- mention any existing team rule files that were left untouched
- mention any missing information that still needs Runbook updates
