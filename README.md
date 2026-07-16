# AI OS Wiki CLI

Obsidian 기반 AI OS/LLM Wiki를 프로젝트에 연결하는 로컬 CLI다.

## Usage

패키지를 설치해서 쓰는 형태는 아래를 목표로 한다.

```bash
npm install -g ai-os-wiki-cli
ai-os setup --dry-run
ai-os setup
```

설치 없이 npm에서 바로 실행하려면:

```bash
npx ai-os-wiki-cli setup --dry-run
npx ai-os-wiki-cli setup
```

GitHub에서 바로 실행하려면:

```bash
npx github:littleduck1219/ai-os-wiki-cli setup --dry-run
npx github:littleduck1219/ai-os-wiki-cli setup
```

`npx ... setup`은 CLI 실행이지 Codex 플러그인 설치가 아니다. 반드시 연결할 프로젝트 폴더 안에서 실행한다. 홈 디렉터리(`~`)에서는 `setup`이 거부된다.

현재 폴더를 AI OS 위키에 연결하려면 `setup`을 사용한다.

```bash
node bin/ai-os.mjs setup --dry-run
node bin/ai-os.mjs setup
```

처음 사용하는 컴퓨터에서는 Obsidian vault 위치를 먼저 알려준다.

```bash
ai-os config set-vault --vault "/path/to/obsidian-vault"
ai-os config show
```

또는 한 번만 명령에 직접 넘길 수 있다.

```bash
ai-os setup --vault "/path/to/obsidian-vault" --dry-run
```

`setup`은 기본적으로 다음 값을 추론한다.

- vault: `--vault`, `AI_OS_VAULT`, 저장된 config, 존재하는 로컬 기본값 순서
- project path: 현재 작업 폴더
- project name: 현재 프로젝트 폴더명
- project slug: project name을 slug로 변환한 값

로컬에서 `ai-os` 명령으로 실행하려면:

```bash
npm run install:local
ai-os setup --dry-run
```

명시적으로 모든 값을 지정하려면 `connect-project`를 사용한다.

```bash
node bin/ai-os.mjs connect-project \
  --vault "/Users/littleduck/littleduck" \
  --project-name "typeorm" \
  --project-slug "typeorm" \
  --project-path "/Users/littleduck/Documents/github/coding_study/Frameworks/typeorm"
```

먼저 결과를 확인하려면 `--dry-run`을 붙인다.

```bash
node bin/ai-os.mjs connect-project \
  --vault "/Users/littleduck/littleduck" \
  --project-name "typeorm" \
  --project-slug "typeorm" \
  --project-path "/path/to/repo" \
  --dry-run
```

## What It Creates

- Obsidian project wiki under `60.AI OS/Projects/{project-slug}`
- Project root and three hub documents:
  - `📒 {project-slug}`
  - `📕 {project-slug} Features`
  - `📕 {project-slug} Assets`
  - `📕 {project-slug} Operations`
- Operations documents:
  - `📗 {project-slug} Active Context`
  - `📗 {project-slug} Runbook`
  - `📗 {project-slug} Decision Log`
  - `📗 {project-slug} Session Brief`
  - `91 Work Records/📕 {project-slug} Work Records`
  - `92 Follow-ups/📕 {project-slug} Follow-ups`

The Runbook is mandatory for every connected project. After connection, the AI must inspect the repository and populate installation, execution, build, test, database, Docker/services, ports, and environment-file information. A generated Runbook containing blank placeholders does not count as completed wiki initialization.

`📕 {project-slug} Operations` is the top-level operations index. Keep reusable state, run, decision, session, issue, work-record, and follow-up sections linked from it. Do not place ad hoc work logs directly in `90 Operations/`; put them under `90 Operations/91 Work Records/{Work Unit}/` and index the work unit or record in `📕 {project-slug} Work Records`. Put newly discovered future fixes under `90 Operations/92 Follow-ups/` and index them in `📕 {project-slug} Follow-ups`.

Filename icons are structural sort keys:

- `📒` project root only
- `📕` major hubs and top-level indexes: Features, Assets, Operations, Work Records, Follow-ups, Issue Map, Issue Records
- `📗` operational, rule, protocol, template, and mid-level documents: Active Context, Runbook, Decision Log, Session Brief, feature/domain summaries, asset summaries, issue rules
- `📘` actual leaf/detail records: work record entries, issue record entries, follow-up entries, deep implementation/detail notes

Do not create AI OS Wiki notes with `📄`; it sorts outside the intended hierarchy.

- Issue structure:
  - `Issues/📕 {project-slug} Issue Map`
  - `Issues/00 Issue Rules/`
  - `Issues/10 Issue Records/📕 {project-slug} Issue Records`
- repo pointer files:
  - `CODEX.md`
  - `CLAUDE.md`
  - `GEMINI.md`
- `.gitignore` entries for AI Wiki/session pointer files

If `CODEX.md`, `CLAUDE.md`, or `GEMINI.md` already exists, the CLI preserves the existing content and only appends or updates a marked `AI OS Wiki Pointer` block.

## Codex Plugin

이 repo에는 Codex 세션마다 자동 적용되는 AI OS Wiki 플러그인 정의가 포함되어 있다. Codex 앱에서 사용하려면 이 repo가 Codex 플러그인 마켓플레이스 또는 지원되는 플러그인 소스에 등록되어야 한다.

```text
.codex-plugin/plugin.json
.agents/plugins/marketplace.json
AGENTS.md
hooks/claude-codex-hooks.json
hooks/ai-os-wiki-activate.js
commands/ai-os-wiki.toml
skills/ai-os-wiki/SKILL.md
```

핵심은 `hooks/claude-codex-hooks.json`다. Ponytail처럼 플러그인이 설치되면 SessionStart hook이 `AGENTS.md`를 세션 컨텍스트로 주입한다. `/ai-os-wiki` command와 skill은 수동 연결 요청을 위한 보조 진입점이다.

사용 흐름:

1. 이 repo를 GitHub에 push한다.
2. Codex marketplace에 이 repo를 추가한다.

```bash
codex plugin marketplace add littleduck1219/ai-os-wiki-cli
```

3. `ai-os-wiki@ai-os-wiki` 플러그인을 활성화한다.

```bash
codex plugin add ai-os-wiki@ai-os-wiki
```

4. 새 Codex 세션을 연다. `AGENTS.md` 지시가 자동 적용된다.
5. 연결할 프로젝트 세션에서 아래처럼 요청한다.

```text
/ai-os-wiki 이 프로젝트를 AI OS Wiki에 연결해줘
```

플러그인이 사용하는 기본 명령:

```bash
ai-os setup
```

로컬 `ai-os` 명령이 없으면:

```bash
npx github:littleduck1219/ai-os-wiki-cli setup
```

## Claude Code Plugin

Claude Code에서도 같은 hook을 사용한다.

```bash
claude plugin marketplace add littleduck1219/ai-os-wiki-cli
claude plugin install ai-os-wiki@ai-os-wiki
```

설치 후 새 Claude Code 세션을 열면 `.claude-plugin/plugin.json`이 `hooks/claude-codex-hooks.json`을 통해 `AGENTS.md`의 AI OS Wiki 규칙을 주입한다.

한 세션에서만 직접 테스트하려면:

```bash
claude --plugin-dir /Users/littleduck/Documents/LLM\ Systrem
```

## Record An Issue

Use `record-issue` when an AI session receives an error, screenshot, install failure, field issue, or log.

```bash
node bin/ai-os.mjs record-issue \
  --vault "/Users/littleduck/littleduck" \
  --project-name "VM Migrator" \
  --project-slug "vm-migrator" \
  --title "OpenStack Endpoint No Route To Host" \
  --summary "OpenStack endpoint route failure" \
  --error-signature "RESTEASY004655; java.net.NoRouteToHostException: No route to host" \
  --recognition-rule "If this error appears during OpenStack calls, classify it as an endpoint routing issue."
```

This creates a `📘` issue note without a date prefix under `90 Operations/Issues/10 Issue Records/` and indexes it in `📕 {project-slug} Issue Records`.

## Publish

GitHub remote를 만든 뒤:

```bash
git remote add origin https://github.com/littleduck1219/ai-os-wiki-cli.git
git add README.md package.json bin scripts .gitignore
git commit -m "Initial AI OS wiki CLI"
git push -u origin main
```

npm 배포 전 확인:

```bash
npm run check
npm run pack:dry-run
```

npm에 공개 배포:

```bash
npm login
npm publish
```
