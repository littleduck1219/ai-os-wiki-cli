---
name: ai-os-wiki
description: Use when the user asks to connect the current project to the Obsidian AI OS Wiki, initialize project wiki docs, create AI OS pointer files, or mentions /ai-os-wiki.
---

# AI OS Wiki

Connect the current project to the user's Obsidian AI OS Wiki with the existing `ai-os-wiki-cli`.

## Default Workflow

1. Inspect the current project root and existing `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `.ai-os/CODEX.md`, and `.gitignore` files.
2. Do not run setup from the user's home directory. Ask the user to open the actual project folder or pass `--project-path`.
3. Prefer the local CLI when available:

   ```bash
   ai-os setup
   ```

4. If `ai-os` is not installed, use the GitHub package:

   ```bash
   npx github:littleduck1219/ai-os-wiki-cli setup
   ```

5. If setup reports a missing vault or missing `ai-os.json`, ask the user for the Obsidian vault path, then initialize it:

   ```bash
   npx github:littleduck1219/ai-os-wiki-cli init --vault "/path/to/vault"
   ```

   If the vault already has an AI OS layout, match it instead of creating new folders (e.g. `--settings-folder "60.AI OS" --projects-root "60.AI OS/Projects"`). Then rerun setup from the actual project folder. Wiki placement and the Atlas numbering integration are configured in `<vault>/<settings-folder>/ai-os.json`.
6. Do not overwrite team-owned `AGENTS.md`, `CLAUDE.md`, or `CODEX.md`. If those files already contain unrelated project rules, keep the AI OS pointer in `.ai-os/CODEX.md` and make sure `.ai-os/` is ignored.
7. After connecting, read the generated pointer and verify these docs exist:
   - project root
   - Active Context
   - Runbook
   - Session Brief
   - Decision Log
   - Work Records
   - Follow-ups
   - Issue Map

## Follow-up Initialization

Treat the Runbook as the project's operation guide, not always as an application execution guide. For executable software repositories, inspect real project files and populate install, run, build, test, database, Docker/services, ports, and environment details. For documentation, portfolio, server-build, or knowledge projects, do not write "no run method" just because no package scripts exist; record the actual writing, publishing, deployment, or operating workflow instead, and leave unverified values as `Unverified`. Do not overwrite existing human-written Runbook content unless the user explicitly asks for a refresh.

## Filename Icon Hierarchy

AI OS Wiki filename icons are structural sort keys:

- `📒` project root only.
- `📕` major hubs and top-level indexes: Features, Assets, Operations, Work Records, Follow-ups, Issue Map, Issue Records.
- `📗` operational, rule, protocol, template, and mid-level documents: Active Context, Runbook, Decision Log, Session Brief, feature/domain summaries, asset summaries, issue rules.
- `📘` actual leaf/detail records: work record entries, issue record entries, follow-up entries, deep implementation/detail notes.
- Never create AI OS Wiki notes with `📄`.

## Output

Keep the final response short:

- state which command ran
- state where the project wiki was created
- mention any existing team rule files that were left untouched
- mention any missing information that still needs Runbook updates
