# AI OS Wiki CLI

Obsidian 기반 AI OS/LLM Wiki를 프로젝트에 연결하는 로컬 CLI이자, Claude Code / Codex 세션에 AI OS Wiki 규칙을 항상 주입하는 플러그인이다.

## Install

플러그인은 세션 시작과 프롬프트 제출 시 작은 Node.js hook을 실행하므로 `node`가 PATH에 있어야 한다.

### Claude Code

Claude Code 안에서 아래 두 명령을 각각 보낸다.

```
/plugin marketplace add littleduck1219/ai-os-wiki-cli
```

```
/plugin install ai-os-wiki@ai-os-wiki
```

터미널에서 직접 설치하려면:

```bash
claude plugin marketplace add littleduck1219/ai-os-wiki-cli
claude plugin install ai-os-wiki@ai-os-wiki
```

새 세션을 열면 AI OS Wiki 규칙이 자동 적용된다.

### Codex

```bash
codex plugin marketplace add littleduck1219/ai-os-wiki-cli
codex plugin add ai-os-wiki@ai-os-wiki
```

`codex`를 실행해 `/hooks`에서 lifecycle hook을 확인·신뢰한 뒤 새 스레드를 연다.

### After Install

연결할 프로젝트 세션에서 아래처럼 요청한다.

```text
/ai-os-wiki 이 프로젝트를 AI OS Wiki에 연결해줘
```

처음 사용하는 컴퓨터에서는 Obsidian vault 위치를 먼저 저장한다.

```bash
npx github:littleduck1219/ai-os-wiki-cli config set-vault --vault "/path/to/obsidian-vault"
```

## CLI Usage

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

The Runbook is mandatory for every connected project, but it is an operation guide, not always an app execution guide. For executable software repositories, the AI should populate installation, execution, build, test, database, Docker/services, ports, and environment-file information from real files. For documentation, portfolio, server-build, or knowledge projects, it should record the actual writing, publishing, deployment, or operating workflow instead of writing that no run method exists. Existing human-written Runbook content must not be overwritten unless the user asks for a refresh.

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

## Plugin Architecture

Claude Code와 Codex는 같은 hook 정의(`hooks/claude-codex-hooks.json`)를 공유한다. 플러그인이 설치되면 SessionStart hook이 `AGENTS.md`의 AI OS Wiki 규칙을 세션 컨텍스트로 주입하고, UserPromptSubmit hook이 매 프롬프트마다 이를 유지한다. 두 lifecycle 이벤트는 플러그인 UI에서 따로 표시될 수 있도록 별도 스크립트를 쓴다:

- `hooks/ai-os-wiki-session-start.js`
- `hooks/ai-os-wiki-prompt-submit.js`

```text
.claude-plugin/plugin.json        # Claude Code 플러그인 매니페스트
.claude-plugin/marketplace.json   # Claude Code 마켓플레이스 정의
.codex-plugin/plugin.json         # Codex 플러그인 매니페스트
.agents/plugins/marketplace.json  # Codex 마켓플레이스 정의
AGENTS.md                         # 주입되는 AI OS Wiki 규칙
hooks/claude-codex-hooks.json     # 공용 hook 정의
commands/ai-os-wiki.toml          # /ai-os-wiki command
skills/ai-os-wiki/SKILL.md        # ai-os-wiki skill
```

`/ai-os-wiki` command와 skill은 수동 연결 요청을 위한 보조 진입점이다. 플러그인이 프로젝트 연결에 사용하는 기본 명령은 `ai-os setup`이고, 로컬 `ai-os`가 없으면 `npx github:littleduck1219/ai-os-wiki-cli setup`을 쓴다.

로컬 checkout을 한 세션에서만 직접 테스트하려면:

```bash
claude --plugin-dir /path/to/ai-os-wiki-cli
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

플러그인 배포는 `main`에 push하면 끝이다. 마켓플레이스가 이 repo를 직접 바라본다.

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
