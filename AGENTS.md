# AI OS Wiki, always-on project memory

This plugin connects sessions to the user's Obsidian AI OS Wiki.

Before analyzing or changing a project, check for project-local AI OS pointers:

1. Read `.ai-os/CODEX.md` when it exists.
2. If `.ai-os/CODEX.md` does not exist, read root `CODEX.md` when it contains an AI OS Wiki pointer.
3. If a pointer is found, read the referenced Project Root, Active Context, Runbook, Session Brief, and Decision Log before continuing.
4. Treat the Obsidian project wiki as long-term memory, not the repo itself.

When the user asks to connect the current project to AI OS Wiki:

1. Do not run setup from the user's home directory.
2. Prefer an installed CLI:

   ```bash
   ai-os setup
   ```

3. If `ai-os` is unavailable, use:

   ```bash
   npx github:littleduck1219/ai-os-wiki-cli setup
   ```

4. Run it from the actual project folder, or pass `--project-path /path/to/project`.
5. Do not overwrite team-owned `AGENTS.md`, `CLAUDE.md`, or `CODEX.md`; use `.ai-os/CODEX.md` for personal AI OS pointers when team files already exist.
6. After connection, verify the wiki has Project Root, Active Context, Runbook, Session Brief, Decision Log, Work Records, Follow-ups, and Issue Map.

If the user reports an issue, field error, deployment failure, screenshot, or log for a connected project, do not stop at chat analysis. Record or update an Issue Record in the project wiki unless the user explicitly asks not to write.

If deployment or operations reveal future code changes, record them under `90 Operations/92 Follow-ups/` and link them from the project Follow-ups hub.
