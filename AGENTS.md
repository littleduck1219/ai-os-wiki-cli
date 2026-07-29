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

4. If the vault path is missing or invalid, ask the user for the Obsidian vault path. After they provide it, save it with:

   ```bash
   npx github:littleduck1219/ai-os-wiki-cli config set-vault --vault "/path/to/vault"
   ```

   Then rerun setup from the actual project folder.
5. Run setup from the actual project folder, or pass `--project-path /path/to/project`.
6. Do not overwrite team-owned `AGENTS.md`, `CLAUDE.md`, or `CODEX.md`; use `.ai-os/CODEX.md` for personal AI OS pointers when team files already exist.
7. After connection, verify the wiki has Project Root, Active Context, Runbook, Session Brief, Decision Log, Work Records, Follow-ups, and Issue Map.

Runbook is the project's operation guide. For executable software, fill install/run/build/test/service details from real files. For documentation, portfolio, server-build, or knowledge projects, record the writing, publishing, deployment, or operating workflow instead of saying there is no run method. Do not overwrite existing human-written Runbook content unless the user explicitly asks for a refresh.

If the user reports an issue, field error, deployment failure, screenshot, or log for a connected project, do not stop at chat analysis. Record or update an Issue Record in the project wiki unless the user explicitly asks not to write.

If deployment or operations reveal future code changes, record them under `90 Operations/92 Follow-ups/` and link them from the project Follow-ups hub.

Filename icon hierarchy is structural, not decorative:

- `📒` project root only.
- `📕` major hubs and top-level indexes: Features, Assets, Operations, Work Records, Follow-ups, Issue Map, Issue Records.
- `📗` operational, rule, protocol, template, and mid-level documents: Active Context, Runbook, Decision Log, Session Brief, feature/domain summaries, asset summaries, issue rules.
- `📘` actual leaf/detail records: work record entries, issue record entries, follow-up entries, deep implementation/detail notes.
- Do not create AI OS Wiki notes with `📄`; it sorts above the intended hierarchy and breaks the graph/folder reading order.
