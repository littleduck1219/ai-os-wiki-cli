# Vault generalization + Atlas — design

Approved in session 2026-08-04.

## Problem

The CLI hardcodes the wiki location (`60.AI OS/Projects`) and knows nothing
about the vault's numbering system. New users get littleduck's personal layout
forced on them; the numbering system's old name (CMDS) is being retired.

## Decisions

1. **Wiki root becomes config** — no hardcoded `60.AI OS`.
2. **Two config layers**:
   - Machine (`~/.config/ai-os`): `{ vault, settingsFolder }` — only "where is
     the vault".
   - Vault (`<vault>/<settingsFolder>/ai-os.json`) — shared across machines via
     Obsidian sync:
     ```json
     {
       "projectsRoot": "AI OS Settings/Projects",
       "atlas": {
         "enabled": true,
         "projectConnector": "📚 515 Project Wiki",
         "settingsConnector": "📚 516 AI OS Settings",
         "connectorFolder": "10.Guideline/connector"
       }
     }
     ```
3. **`ai-os init`** (new, idempotent, non-interactive):
   `ai-os init --vault <path> [--settings-folder …] [--projects-root …] [--no-atlas]`
   Creates the settings folder, `ai-os.json`, projects root, and missing Atlas
   connector notes. littleduck's vault: `--settings-folder "60.AI OS"
   --projects-root "60.AI OS/Projects"` — no file moves.
4. **First-run onboarding**: the SessionStart hook detects a missing machine
   config and injects one line telling the agent to ask the user for the vault
   path and run `ai-os init --vault <path>`. AGENTS.md and the skill document
   the same flow.
5. **Atlas integration** (the numbering system, renamed from CMDS):
   - Project root docs get frontmatter `Atlas: "[[📚 515 Project Wiki]]"`.
   - Sub-docs link the project root (`[[📒 slug]]`) per the vault's link rule.
   - `setup` appends the project root link to the project connector note
     (skip if present). `--no-atlas` / `atlas.enabled: false` skips all of it.
6. **Clean break**: without `ai-os.json`, `setup` errors with "run `ai-os init`
   first". No silent legacy fallback. Version 0.2.0.
7. **Vault migration (one-off, not shipped in the CLI)**: in littleduck's vault,
   after a full backup — frontmatter key `CMDS:` → `Atlas:`, rename
   `🏛 CMDS.md` / `📗 CMDS Head Quarter.md` / `📗 CMDS Guide_옵시디언 체계 참고.md`
   to Atlas names, rewrite wikilinks to those notes, replace CMDS wording and
   `#cmds` tags. `.sync-conflict-*` files untouched.

## Verification

One smoke test covering: init idempotence, config resolution (machine → vault),
setup output contains Atlas frontmatter and connector update.

## Non-goals

- Free-form per-project wiki locations.
- Full Atlas scaffolding (🏛/📖 hierarchy) in fresh vaults — connectors only.
- Interactive TTY prompts in the CLI (the agent mediates questions).
