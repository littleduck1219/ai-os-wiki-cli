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

현재 폴더를 AI OS 위키에 연결하려면 `setup`을 사용한다.

```bash
node bin/ai-os.mjs setup --dry-run
node bin/ai-os.mjs setup
```

`setup`은 기본적으로 다음 값을 추론한다.

- vault: `AI_OS_VAULT` 환경변수 또는 `/Users/littleduck/littleduck`
- project path: 현재 작업 폴더
- project name: `package.json`의 `name` 또는 폴더명
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
- Project index and three hub documents:
  - `📒 {project-slug} Index`
  - `📕 {project-slug} Features`
  - `📕 {project-slug} Assets`
  - `📕 {project-slug} Operations`
- Issue structure:
  - `Issues/📕 {project-slug} Issue Map`
  - `Issues/00 Issue Rules/`
  - `Issues/10 Issue Records/📕 {project-slug} Issue Records`
- repo pointer files:
  - `CODEX.md`
  - `CLAUDE.md`
  - `GEMINI.md`
- `.gitignore` entries for AI Wiki/session pointer files

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
