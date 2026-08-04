<h1 align="center">AI OS Wiki</h1>

<p align="center">
  <em>에이전트는 세션이 끝나면 전부 잊는다. 이 플러그인은 기억하게 만든다.</em>
</p>

<p align="center">
  <sub><a href="README.md">English</a></sub>
</p>

---

새 에이전트 세션은 언제나 0에서 시작한다: 코드를 grep하고, 프로젝트 상태를 추측하고, 지난주에 답했던 질문을 또 묻는다. 코드에는 *왜* SQLite를 골랐는지, *뭘* 하던 중이었는지, *어떻게* 배포하는지가 적혀 있지 않다.

AI OS Wiki는 Claude Code / Codex 플러그인 + 작은 CLI다. 각 프로젝트를 Obsidian vault 안의 구조화된 프로젝트 위키(Active Context, Decision Log, Runbook, Session Brief, Issue Records)에 연결하고, 매 세션에 그 위키를 읽고 유지하라는 규칙을 주입한다. 위키가 에이전트의 장기기억이 되고, repo는 깨끗하게 유지된다.

## Before / after

새 세션에 *"이 프로젝트에서 지금 뭘 작업 중이고 어디까지 됐어?"* 라고 물었을 때 — 아래 두 답변은 벤치마크 실행에서 그대로 가져온 것이다.

위키 없이:

> 모르겠습니다. 이 프로젝트(orbit-notes, 작은 노트 API)에는 AI OS Wiki 포인터도 상세한 프로젝트 문서도 없습니다. README에는 기본 실행 방법만 있습니다. 무엇을 작업 중인지 알려주셔야 합니다.

위키 연결 후:

> JSON 파일 저장소에서 SQLite로 마이그레이션 중이며 약 절반 진행됐습니다: SQLite 스키마 설계는 완료, 쓰기 경로는 미구현. 다음 작업: 마이그레이션 완료(`store.mjs` 교체) 후 `DELETE /notes/:id` 엔드포인트 추가. 지난 세션에서는 `listNotes` 페이지네이션의 off-by-one 버그를 수정했습니다.

## Numbers

실제 headless 에이전트(`claude -p`, Haiku)로 측정했다. 답이 위키에만 존재하는 fixture repo에서 프로젝트 컨텍스트 질문 8개를 던지고 — 일주일 만에 프로젝트로 돌아온 상황과 같다 — 답변을 judge 모델이 사실 단위로 채점한다 (arm당 질문별 3회 실행, arm당 채점 대상 사실 51개).

| | fact recall |
|---|--:|
| 순정 에이전트 (코드만) | **8%** (4/51 facts) |
| **AI OS Wiki 연결** | **84%** (43/51 facts) |

이 격차가 핵심이다: 진행 상황, 과거 결정, 배포 절차, 알려진 이슈는 애초에 코드에 없다. `node benchmarks/run.mjs`로 재현할 수 있다 — 방법론, fixture, 원본 결과는 [benchmarks/](benchmarks/)에 있다.

## Install

플러그인은 작은 Node.js lifecycle hook 두 개를 실행하므로 `node`가 PATH에 있어야 한다.

### Claude Code

아래 두 명령을 각각 따로 보낸다:

```
/plugin marketplace add littleduck1219/ai-os-wiki-cli
```

```
/plugin install ai-os-wiki@ai-os-wiki
```

터미널에서 직접:

```bash
claude plugin marketplace add littleduck1219/ai-os-wiki-cli
claude plugin install ai-os-wiki@ai-os-wiki
```

### Codex

```bash
codex plugin marketplace add littleduck1219/ai-os-wiki-cli
codex plugin add ai-os-wiki@ai-os-wiki
```

`codex`를 실행해 `/hooks`에서 lifecycle hook 두 개를 신뢰하고 새 스레드를 연다.

## 프로젝트 연결

처음 쓰는 컴퓨터에서는 Obsidian vault 위치를 한 번만 알려준다:

```bash
npx github:littleduck1219/ai-os-wiki-cli config set-vault --vault "/path/to/obsidian-vault"
```

그다음 연결할 프로젝트 안의 세션에서:

```text
/ai-os-wiki 이 프로젝트를 AI OS Wiki에 연결해줘
```

끝. 이후 그 프로젝트의 새 세션은 코드를 만지기 전에 위키를 읽고, 작업하면서 결정·이슈·후속 작업을 위키에 기록한다.

## 생성되는 것

vault의 `60.AI OS/Projects/{project-slug}` 아래:

```text
📒 {project}                      프로젝트 루트
📕 {project} Features / Assets / Operations
📗 {project} Active Context       지금 작업 중인 것
📗 {project} Runbook              실행·배포·운영 방법
📗 {project} Decision Log         무엇을 왜 선택했는지
📗 {project} Session Brief        지난 세션이 끝난 지점
91 Work Records/📕 …              작업 단위별 기록
92 Follow-ups/📕 …                작업 중 발견한 미래의 수정거리
Issues/📕 {project} Issue Map     알려진 이슈와 인식 규칙
```

repo에는 포인터 파일(`CLAUDE.md`, `CODEX.md`, `GEMINI.md`)만 쓴다. 기존 팀 파일은 보존된다 — CLI는 덮어쓰지 않고 표시된 포인터 블록만 추가하며, `.gitignore` 항목으로 개인 포인터가 repo에 들어가지 않게 한다.

파일명 이모지는 장식이 아니라 구조적 정렬 키다: `📒` 프로젝트 루트, `📕` 허브·인덱스, `📗` 운영 문서, `📘` 말단 기록.

## CLI 레퍼런스

```bash
ai-os setup                # 현재 폴더 연결 (vault·이름·slug 자동 추론)
ai-os setup --dry-run      # 쓰지 않고 미리보기
ai-os config set-vault --vault "/path"
ai-os config show
ai-os connect-project --vault … --project-name … --project-slug … --project-path …
ai-os record-issue --title … --summary … --error-signature … --recognition-rule …
```

전역 설치는 `npm install -g ai-os-wiki-cli`, 일회 실행은 `npx github:littleduck1219/ai-os-wiki-cli`, 로컬은 `npm run install:local`. `setup`은 홈 디렉터리에서 실행을 거부한다 — 프로젝트 폴더에서 실행하거나 `--project-path`를 넘긴다.

## 플러그인 구조

Claude Code와 Codex는 hook 정의 하나(`hooks/claude-codex-hooks.json`)를 공유한다. 설치되면 SessionStart hook이 `AGENTS.md`의 AI OS Wiki 규칙을 세션에 주입하고, UserPromptSubmit hook이 매 프롬프트마다 유지한다. `/ai-os-wiki` command와 skill은 프로젝트 연결을 위한 수동 진입점이다.

```text
.claude-plugin/plugin.json        Claude Code 플러그인 매니페스트
.claude-plugin/marketplace.json   Claude Code 마켓플레이스 정의
.codex-plugin/plugin.json         Codex 플러그인 매니페스트
.agents/plugins/marketplace.json  Codex 마켓플레이스 정의
AGENTS.md                         주입되는 AI OS Wiki 규칙
hooks/claude-codex-hooks.json     공용 hook 정의
commands/ai-os-wiki.toml          /ai-os-wiki command
skills/ai-os-wiki/SKILL.md        ai-os-wiki skill
```

로컬 checkout을 한 세션에서만 테스트하려면 `claude --plugin-dir /path/to/ai-os-wiki-cli`.

## Publish

플러그인 배포는 `main`에 push하면 끝 — 마켓플레이스가 이 repo를 직접 바라본다. npm 배포 전에는 `npm run check && npm run pack:dry-run`, 그다음 `npm publish`.
