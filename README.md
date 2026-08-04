<h1 align="center">AI OS Wiki</h1>

<p align="center">
  <em>Your agent forgets everything between sessions. This makes it remember.</em>
</p>

<p align="center">
  <sub><a href="README.ko.md">한국어</a></sub>
</p>

---

Every new agent session starts from zero: it greps the code, guesses the state of the project, and re-asks questions you answered last week. The code never says *why* SQLite was chosen, *what* you were in the middle of, or *how* the thing is deployed.

AI OS Wiki is a Claude Code / Codex plugin plus a small CLI that connects each project to a structured project wiki in your Obsidian vault — Active Context, Decision Log, Runbook, Session Brief, Issue Records — and injects the rules to read and maintain it into every session. The wiki is the agent's long-term memory; the repo stays clean.

## Before / after

Ask a fresh session *"What is currently being worked on in this project, and how far along is it?"* — both answers below are verbatim from a benchmark run (the second translated from Korean).

Without the wiki:

> I don't know. This project (orbit-notes, a tiny notes API) doesn't have any AI OS Wiki pointers or detailed project documentation. The README only shows basic startup instructions. You'll need to tell me what you're working on.

With the wiki connected:

> Migrating storage from the JSON file store to SQLite, about halfway done: the SQLite schema design is complete, the write path is not implemented yet. Next: finish the migration (replace `store.mjs`), then add a `DELETE /notes/:id` endpoint. The last session fixed an off-by-one bug in `listNotes` pagination.

## Numbers

Measured with a real headless agent (`claude -p`, Haiku), answering 8 project-context questions in a fixture repo where the answers live only in the wiki — the same situation as returning to a project after a week. Answers are graded fact-by-fact by a judge model (3 runs per question per arm, 51 gradable facts per arm).

| | fact recall |
|---|--:|
| bare agent (code only) | **8%** (4/51 facts) |
| **with AI OS Wiki** | **84%** (43/51 facts) |

The gap is the point: status, past decisions, deploy procedure, and known issues are simply not in the code. Reproduce it with `node benchmarks/run.mjs` — method, fixture, and raw results are in [benchmarks/](benchmarks/).

## Install

The plugin runs two small Node.js lifecycle hooks, so `node` must be on your PATH.

### Claude Code

Send these as two separate prompts:

```
/plugin marketplace add littleduck1219/ai-os-wiki-cli
```

```
/plugin install ai-os-wiki@ai-os-wiki
```

Or from a terminal:

```bash
claude plugin marketplace add littleduck1219/ai-os-wiki-cli
claude plugin install ai-os-wiki@ai-os-wiki
```

### Codex

```bash
codex plugin marketplace add littleduck1219/ai-os-wiki-cli
codex plugin add ai-os-wiki@ai-os-wiki
```

Run `codex`, open `/hooks`, trust the two lifecycle hooks, and start a new thread.

## Connect a project

On a machine where you haven't used AI OS Wiki before, point it at your Obsidian vault once:

```bash
npx github:littleduck1219/ai-os-wiki-cli config set-vault --vault "/path/to/obsidian-vault"
```

Then, in a session inside the project you want to connect:

```text
/ai-os-wiki Connect this project to the AI OS Wiki
```

That's it. New sessions in that project now read the wiki before touching the code, and record decisions, issues, and follow-ups back into it as they work.

## What it creates

Under `60.AI OS/Projects/{project-slug}` in your vault:

```text
📒 {project}                      project root
📕 {project} Features / Assets / Operations
📗 {project} Active Context       what is being worked on right now
📗 {project} Runbook              how to run, deploy, and operate it
📗 {project} Decision Log         what was chosen and why
📗 {project} Session Brief        where the last session left off
91 Work Records/📕 …              per-work-unit records
92 Follow-ups/📕 …                future fixes discovered along the way
Issues/📕 {project} Issue Map     known issues and recognition rules
```

In the repo it writes only pointer files (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`). Existing team files are preserved — the CLI appends a marked pointer block instead of overwriting, and `.gitignore` entries keep personal pointers out of the repo.

The filename emoji are structural sort keys, not decoration: `📒` project root, `📕` hubs and indexes, `📗` operational documents, `📘` leaf records.

## CLI reference

```bash
ai-os setup                # connect the current folder (infers vault, name, slug)
ai-os setup --dry-run      # preview without writing
ai-os config set-vault --vault "/path"
ai-os config show
ai-os connect-project --vault … --project-name … --project-slug … --project-path …
ai-os record-issue --title … --summary … --error-signature … --recognition-rule …
```

Install globally with `npm install -g ai-os-wiki-cli`, run once with `npx github:littleduck1219/ai-os-wiki-cli`, or locally with `npm run install:local`. `setup` refuses to run from your home directory — run it from the project folder or pass `--project-path`.

## Plugin architecture

Claude Code and Codex share one hook definition (`hooks/claude-codex-hooks.json`). On install, a SessionStart hook injects the AI OS Wiki rules from `AGENTS.md` into the session, and a UserPromptSubmit hook keeps them active on every prompt. The `/ai-os-wiki` command and skill are manual entry points for connecting projects.

```text
.claude-plugin/plugin.json        Claude Code plugin manifest
.claude-plugin/marketplace.json   Claude Code marketplace definition
.codex-plugin/plugin.json         Codex plugin manifest
.agents/plugins/marketplace.json  Codex marketplace definition
AGENTS.md                         the injected AI OS Wiki rules
hooks/claude-codex-hooks.json     shared hook definition
commands/ai-os-wiki.toml          /ai-os-wiki command
skills/ai-os-wiki/SKILL.md        ai-os-wiki skill
```

Test a local checkout in a single session with `claude --plugin-dir /path/to/ai-os-wiki-cli`.

## Publish

Plugin releases are just pushes to `main` — the marketplaces point at this repo. Before publishing to npm: `npm run check && npm run pack:dry-run`, then `npm publish`.
