#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const AI_OS_DIR = "60.AI OS";
const PROJECT_WIKI_CONNECTOR = "📚 515 Project Wiki";
const PROJECT_WIKI_CONNECTOR_FILE = `${PROJECT_WIKI_CONNECTOR}.md`;
const DEFAULT_VAULT = "/Users/littleduck/littleduck";
const CONFIG_DIR = path.join(os.homedir(), ".ai-os-wiki-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const IGNORE_BLOCK = `# AI Wiki / LLM session pointers
/CODEX.md
/CLAUDE.md
/GEMINI.md
/AGENTS.md
/docs/ai/
/.claude/
/.codex/
`;

function main() {
  const [command, ...argv] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printMainHelp();
    return;
  }

  if (command === "connect-project") {
    connectProject(parseArgs(argv));
    return;
  }

  if (command === "setup") {
    setupProject(parseArgs(argv));
    return;
  }

  if (command === "config") {
    configCommand(argv);
    return;
  }

  if (command === "record-issue") {
    recordIssue(parseArgs(argv));
    return;
  }

  fail(`Unknown command: ${command}`);
}

function printMainHelp() {
  console.log(`AI OS Wiki CLI

Usage:
  ai-os setup [--project-name <name>]
  ai-os config set-vault --vault <path>
  ai-os connect-project --vault <path> --project-name <name> --project-slug <slug> --project-path <repo>

Commands:
  setup             Infer defaults from the current repo and connect it to AI OS
  config            Save or show AI OS Wiki CLI settings
  connect-project   Create or update an Obsidian project wiki and repo pointer files
  record-issue      Create an issue record note and index it under Issue Records
`);
}

function printSetupHelp() {
  console.log(`Usage:
  ai-os setup [--vault <path>] [--project-name <name>] [--project-slug <slug>] [--project-path <repo>] [--dry-run] [--force]

Options:
  --vault          Obsidian vault path. Priority: --vault, AI_OS_VAULT, config, existing local default
  --project-name   Display name, defaults to the project folder name
  --project-slug   Folder slug, defaults to a slugified project name
  --project-path   Local repo/project path, defaults to current working directory
  --dry-run        Print actions without writing files
  --force          Overwrite existing generated wiki files
`);
}

function printConfigHelp() {
  console.log(`Usage:
  ai-os config set-vault --vault <path>
  ai-os config show

Options:
  --vault          Obsidian vault path to save for future setup commands

Config file:
  ${CONFIG_FILE}
`);
}

function printConnectHelp() {
  console.log(`Usage:
  ai-os connect-project --vault <path> --project-name <name> --project-slug <slug> --project-path <repo> [--dry-run] [--force]

Options:
  --vault          Obsidian vault path
  --project-name   Display name, e.g. "VM Migrator"
  --project-slug   Folder slug, e.g. "vm-migrator"
  --project-path   Local repo/project path to receive pointer files and .gitignore rules
  --dry-run        Print actions without writing files
  --force          Overwrite existing generated wiki files
`);
}

function configCommand(argv) {
  const [subcommand, ...rest] = argv;

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printConfigHelp();
    return;
  }

  if (subcommand === "show") {
    console.log(JSON.stringify(readConfig(), null, 2));
    return;
  }

  if (subcommand === "set-vault") {
    const args = parseArgs(rest);
    if (!args.vault) fail("Missing required option: --vault");
    const vault = path.resolve(args.vault);
    if (!fs.existsSync(vault)) fail(`Vault path does not exist: ${vault}`);
    const config = { ...readConfig(), vault };
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    console.log(`saved vault: ${vault}`);
    return;
  }

  fail(`Unknown config command: ${subcommand}`);
}

function printRecordIssueHelp() {
  console.log(`Usage:
  ai-os record-issue --vault <path> --project-name <name> --project-slug <slug> --title <title> --summary <summary> --error-signature <text> --recognition-rule <text> [--category <name>] [--dry-run]

Options:
  --vault              Obsidian vault path
  --project-name       Display name, e.g. "VM Migrator"
  --project-slug       Folder slug, e.g. "vm-migrator"
  --title              Issue title without date
  --summary            Short issue summary
  --error-signature    Exact log or error code that identifies this issue
  --recognition-rule   Sentence explaining when this issue should be recognized
  --category           Category label, defaults to "Installation"
  --dry-run            Print actions without writing files
`);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--force") {
      args.force = true;
      continue;
    }
    if (!arg.startsWith("--")) fail(`Unexpected argument: ${arg}`);
    const key = toCamel(arg.slice(2));
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${arg}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function setupProject(args) {
  if (args.help) {
    printSetupHelp();
    return;
  }

  const projectPath = path.resolve(args.projectPath || process.cwd());
  if (!args.projectPath && isHomeDirectory(projectPath)) {
    fail("Refusing to run setup from the home directory. Run this inside a project folder or pass --project-path /path/to/project.");
  }

  const projectName = args.projectName || inferProjectName(projectPath);
  const projectSlug = args.projectSlug || slugify(projectName);
  const vault = resolveVault(args);

  connectProject({
    ...args,
    vault,
    projectName,
    projectSlug,
    projectPath,
  });
}

function connectProject(args) {
  if (args.help) {
    printConnectHelp();
    return;
  }

  args.vault = resolveVault(args);

  for (const key of ["vault", "projectName", "projectSlug", "projectPath"]) {
    if (!args[key]) fail(`Missing required option: --${toKebab(key)}`);
  }

  const context = buildContext(args);
  const writes = buildProjectWrites(context);
  const updates = buildProjectUpdates(context);

  for (const [file, content] of writes) {
    writeFile(file, content, context);
  }

  for (const update of updates) {
    update(context);
  }

  log(context, `done: ${context.projectName} connected to AI OS wiki`);
}

function recordIssue(args) {
  if (args.help) {
    printRecordIssueHelp();
    return;
  }

  args.vault = resolveVault(args);

  for (const key of ["vault", "projectName", "projectSlug", "title", "summary", "errorSignature", "recognitionRule"]) {
    if (!args[key]) fail(`Missing required option: --${toKebab(key)}`);
  }

  const context = buildContext({ ...args, projectPath: args.projectPath || process.cwd() });
  const category = args.category || "Installation";
  const date = today();
  const safeTitle = args.title.replace(/[/:]/g, " ").replace(/\s+/g, " ").trim();
  const noteTitle = `📘 ${safeTitle}`;
  const issueFile = path.join(context.projectRoot, "90 Operations", "Issues", "10 Issue Records", `${noteTitle}.md`);
  const recordsHub = path.join(context.projectRoot, "90 Operations", "Issues", "10 Issue Records", `📕 ${context.projectSlug} Issue Records.md`);

  const content = issueRecordNote({
    projectName: context.projectName,
    projectSlug: context.projectSlug,
    title: args.title,
    summary: args.summary,
    errorSignature: args.errorSignature,
    recognitionRule: args.recognitionRule,
    category,
    date,
  });

  writeFile(issueFile, content, context);
  appendIssueRecord(recordsHub, noteTitle, context);
  log(context, `done: issue recorded as ${noteTitle}`);
}

function buildContext(args) {
  const vault = path.resolve(args.vault);
  const projectPath = path.resolve(args.projectPath);
  const projectName = args.projectName;
  const projectSlug = args.projectSlug;
  const projectRoot = path.join(vault, AI_OS_DIR, "Projects", projectSlug);

  return {
    vault,
    projectPath,
    projectName,
    projectSlug,
    projectRoot,
    dryRun: Boolean(args.dryRun),
    force: Boolean(args.force),
  };
}

function buildProjectWrites(context) {
  const p = context.projectRoot;
  const n = context.projectName;
  const slug = context.projectSlug;
  const repo = context.projectPath;

  return new Map([
    [path.join(p, `📒 ${slug}.md`), projectIndex(n, slug, repo)],
    [path.join(p, "10 Features and Domains", `📕 ${slug} Features.md`), featureHub(n, slug)],
    [path.join(p, "20 Shared Assets", `📕 ${slug} Assets.md`), sharedHub(n, slug)],
    [path.join(p, "90 Operations", `📕 ${slug} Operations.md`), operationsHub(n, slug)],
    [path.join(p, "90 Operations", `📗 ${slug} Active Context.md`), activeContext(n, slug, repo)],
    [path.join(p, "90 Operations", `📗 ${slug} Runbook.md`), runbook(n, slug, repo)],
    [path.join(p, "90 Operations", `📗 ${slug} Decision Log.md`), decisionLog(n, slug)],
    [path.join(p, "90 Operations", `📗 ${slug} Session Brief.md`), sessionBrief(n, slug, repo)],
    [path.join(p, "90 Operations", "91 Work Records", `📕 ${slug} Work Records.md`), workRecords(n, slug)],
    [path.join(p, "90 Operations", "92 Follow-ups", `📕 ${slug} Follow-ups.md`), followUps(n, slug)],
    [path.join(p, "90 Operations", "Issues", `📕 ${slug} Issue Map.md`), issueMap(n, slug)],
    [path.join(p, "90 Operations", "Issues", "00 Issue Rules", `📗 ${slug} Installation Issues.md`), issueCategory(n, slug)],
    [path.join(p, "90 Operations", "Issues", "10 Issue Records", `📕 ${slug} Issue Records.md`), issueRecords(n, slug)],
  ]);
}

function buildProjectUpdates(context) {
  return [
    () => upsertPointerDocs(context),
    () => appendGitignore(context),
    () => appendProjectWikiConnector(context),
  ];
}

function projectIndex(name, slug, repo) {
  return note(`📒 ${slug}`, `[[${PROJECT_WIKI_CONNECTOR}]]`, ["ai-os", "llm-wiki", "project", slug, "project-root", "hub"], `# ${slug}

${name} 프로젝트의 LLM Wiki 루트 문서다.

## Ontology Relations

- node_type: project
- contains: [[📕 ${slug} Features]], [[📕 ${slug} Assets]], [[📕 ${slug} Operations]]

## Repo

- \`${repo}\`

## Folder Structure

- root: 프로젝트 입구 문서만 둔다.
- \`10 Features and Domains/\`: 기능, 화면, 도메인 허브와 기능별 하위 폴더
- \`20 Shared Assets/\`: 공통 자산 허브와 자산 영역별 하위 폴더
- \`90 Operations/\`: 운영 허브, 상태, 실행, 결정, 세션 인계, 이슈, 작업 기록, 후속 수정거리

## Project Hubs

- [[📕 ${slug} Features]]
- [[📕 ${slug} Assets]]
- [[📕 ${slug} Operations]]

## Operating Principles

- 이 프로젝트의 장기 컨텍스트는 Obsidian 프로젝트 위키에 저장한다.
- repo의 \`CODEX.md\`, \`CLAUDE.md\`, \`GEMINI.md\`는 이 위키를 읽도록 안내하는 포인터로만 사용한다.
- 현재 진행 상태, 결정 이유, 세션 인계, 이슈 상세는 \`📕 ${slug} Operations\` 아래에서 관리한다.
- 기능 문서는 \`10 Features and Domains/{Feature}/\` 아래에서 관리한다.
- 공통 자산 문서는 \`20 Shared Assets/{Asset Area}/\` 아래에서 관리한다.
- 전역 AI OS 규칙 문서는 프로젝트 문서에서 직접 링크하지 않는다.
`);
}

function featureHub(name, slug) {
  return note(`📕 ${slug} Features`, `[[📒 ${slug}]]`, ["ai-os", "llm-wiki", "project", slug, "feature-map", "hub"], `# ${slug} Features

기능, 화면, 도메인 단위의 허브다. 실제 기능 문서는 기능별 하위 폴더에 둔다.

## Ontology Relations

- node_type: feature_map

## Features

-

## Folder Rule

- 기능 허브는 \`10 Features and Domains/\`에 둔다.
- 기능 문서는 \`10 Features and Domains/{Feature}/\` 아래에 둔다.
`);
}

function sharedHub(name, slug) {
  return note(`📕 ${slug} Assets`, `[[📒 ${slug}]]`, ["ai-os", "llm-wiki", "project", slug, "shared-assets", "asset-map", "hub"], `# ${slug} Assets

여러 기능과 도메인이 공유하는 자산을 관리하는 허브다. 실제 자산 문서는 자산 영역별 하위 폴더에 둔다.

## Ontology Relations

- node_type: shared_assets

## Shared Nodes

-

## Folder Rule

- 공통 자산 허브는 \`20 Shared Assets/\`에 둔다.
- 공통 자산 문서는 \`20 Shared Assets/{Asset Area}/\` 아래에 둔다.
`);
}

function operationsHub(name, slug) {
  return note(`📕 ${slug} Operations`, `[[📒 ${slug}]]`, ["ai-os", "llm-wiki", "project", slug, "operations", "operation", "hub"], `# ${slug} Operations

현재 상태, 실행 기준, 결정 로그, 세션 인계, 이슈 운영, 작업 기록, 후속 수정거리를 모으는 운영 허브다.

이 문서는 \`90 Operations/\`의 상위 인덱스다. 운영 루트에 새 문서를 만들면 반드시 아래의 적절한 섹션에 연결한다.

## Current State

- [[📗 ${slug} Active Context]]
- [[📗 ${slug} Session Brief]]

## Execution

- [[📗 ${slug} Runbook]]

## Decisions

- [[📗 ${slug} Decision Log]]

## Issues

- [[📕 ${slug} Issue Map]]

## Work Records

- [[📕 ${slug} Work Records]]

## Follow-ups

- [[📕 ${slug} Follow-ups]]
`);
}

function activeContext(name, slug, repo) {
  return note(`📗 ${slug} Active Context`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "active-context", "operation"], `# ${slug} Active Context

## Current Goal

-

## Structure Snapshot

- 프로젝트 입구: \`📒 ${slug}\`
- 기능 축 허브: \`📕 ${slug} Features\`
- 공통 자산 허브: \`📕 ${slug} Assets\`
- 운영 축 허브: \`📕 ${slug} Operations\`
- 실행 런북: \`📗 ${slug} Runbook\`
- 작업 기록 허브: \`📕 ${slug} Work Records\`
- 후속 수정거리 허브: \`📕 ${slug} Follow-ups\`

## Current State

- repo 위치: \`${repo}\`

## Observed Issues

-

## Next Steps

1.
`);
}

function runbook(name, slug, repo) {
  return note(`📗 ${slug} Runbook`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "runbook", "operation"], `# ${slug} Runbook

${name} 프로젝트를 운영, 실행, 작성, 배포, 검증하기 위한 런북이다.

> [!IMPORTANT]
> 프로젝트 연결은 이 파일을 생성하는 것으로 끝나지 않는다. 연결을 수행한 AI는 실제 repo를 분석해 아래 항목을 채워야 하며, 확인하지 못한 값은 추측하지 않고 \`미확인\`으로 표시한다. 문서, 포트폴리오, 서버 구축 기록, 지식 프로젝트처럼 실행 대상이 명확하지 않은 경우에는 \`실행 방법 없음\`으로 단정하지 말고 작성, 발행, 배포, 운영 흐름을 기록한다.

## Initialization Requirement

- package manager와 lockfile을 확인한다.
- 소프트웨어 repo라면 설치, 로컬 실행, 빌드, 테스트 명령을 실제 설정 파일에서 확인한다.
- 문서, 포트폴리오, 서버 구축 기록, 지식 프로젝트라면 작성, 발행, 배포, 운영 흐름을 확인한다.
- DB, cache, queue, Docker 사용 여부와 기동 순서를 확인한다.
- 사용 포트와 필수 환경 파일을 확인한다.
- 기존 사람이 작성한 Runbook 내용은 사용자가 갱신을 요청하지 않는 한 덮어쓰지 않는다.

## Environment

- Repo: \`${repo}\`
- Runtime:
- Package Manager:
- Required Services:
- Required Environment Files:
  - \`.env\`
  - \`.env.local\`

## First-Time Setup

\`\`\`bash
# package install command
\`\`\`

## Local Development

\`\`\`bash
# local dev server command
\`\`\`

## Documentation Or Operating Workflow

- Writing entry point:
- Publishing/deployment flow:
- Server or environment operation:

## Build

\`\`\`bash
# production build command
\`\`\`

## Test And Quality

\`\`\`bash
# test command
# lint command
# typecheck command
\`\`\`

## Database

- Engine:
- Local startup:
- Migration:
- Seed:

\`\`\`bash
# database command
\`\`\`

## Docker

- Compose file:
- Services:

\`\`\`bash
# docker compose command
\`\`\`

## Service Startup Order

1. Required infrastructure:
2. Database / cache:
3. Backend:
4. Frontend:
5. Workers / schedulers:

## Ports

- Frontend:
- Backend API:
- Database:
- Other:

## Common Runtime Issues

### Issue Title

- Symptom:
- Error Signature:
- Check:
- Fix:

## Notes For New AI Sessions

- Before changing code, read this Runbook and verify how the project is installed and executed.
- If a command fails, record the failure under \`90 Operations/Issues/10 Issue Records\` when it represents a reusable project issue.
`);
}

function decisionLog(name, slug) {
  return note(`📗 ${slug} Decision Log`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "decision-log", "operation"], `# ${slug} Decision Log

## YYYY-MM-DD - Decision Title

### Context

-

### Decision

-

### Reason

-

### Consequences

-
`);
}

function sessionBrief(name, slug, repo) {
  return note(`📗 ${slug} Session Brief`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "session-brief", "operation"], `# ${slug} Session Brief

이 세션은 Obsidian LLM Wiki를 기준으로 ${name} 프로젝트를 이어서 진행한다.

## Read Order

1. \`${path.join(repo, "CODEX.md")}\`
2. \`${path.join(repo, "CLAUDE.md")}\`
3. \`${path.join(repo, "GEMINI.md")}\`
4. \`${path.join("60.AI OS/Projects", slug, `📒 ${slug}.md`)}\`
5. \`📗 ${slug} Active Context\`
6. \`📗 ${slug} Runbook\`

## Issue Behavior

이슈, 설치 장애, 현장 에러, 스크린샷 분석을 전달받으면 답변으로 끝내지 않고 \`90 Operations/Issues/10 Issue Records\` 아래에 이슈 노트를 생성하고 Issue Map에 인덱싱한다.

## Project Connection Behavior

이 프로젝트가 AI OS Wiki에 새로 연결되었고 Runbook에 빈 항목이 있으면, 코드 수정 전에 repo 구조와 설정 파일을 분석한다. 실행 가능한 소프트웨어 repo라면 설치, 실행, 빌드, 테스트, DB, Docker, 포트 정보를 Runbook에 작성한다. 문서, 포트폴리오, 서버 구축 기록, 지식 프로젝트라면 \`실행 방법 없음\`으로 단정하지 말고 작성, 발행, 배포, 운영 흐름을 Runbook에 작성한다. 기존 사람이 작성한 Runbook은 사용자가 갱신을 요청하지 않는 한 덮어쓰지 않는다.

## Work Record Behavior

작업 이력, 변경 내역, 분석 로그처럼 기능 문서·공유 자산·운영 기준 문서로 분리하기 애매한 기록은 \`90 Operations/91 Work Records/{Work Unit}/📘 {Record Title}.md\`로 만들고 \`📕 ${slug} Work Records\`에 인덱싱한다. \`90 Operations\` 루트에는 기준 문서와 허브 문서만 둔다. \`📄\` 아이콘은 사용하지 않는다.

## Follow-up Behavior

개발·배포·운영 중 새로 발견한 수정거리는 \`90 Operations/92 Follow-ups/\` 아래에 별도 노트로 만들고 \`📕 ${slug} Follow-ups\`에 인덱싱한다. 심각한 장애나 재사용 가능한 버그는 \`Issues/10 Issue Records\`에도 승격한다.
`);
}

function workRecords(name, slug) {
  return note(`📕 ${slug} Work Records`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "work-records", "operation", "hub"], `# ${slug} Work Records

기능 문서나 운영 기준 문서로 분리하기 애매한 실제 작업 기록을 모으는 허브다.

작업 기록은 프로젝트 상태를 설명하는 보조 문서이며, 현재 진행 상태는 [[📗 ${slug} Active Context]], 반복 실행 방법은 [[📗 ${slug} Runbook]], 중요한 설계·운영 결정은 [[📗 ${slug} Decision Log]]에 남긴다.

## Folder Rule

- 실제 작업 기록은 \`90 Operations/91 Work Records/{Work Unit}/\` 아래에 둔다.
- 실제 작업 기록 파일명은 \`📘 {Record Title}.md\`를 사용한다.
- \`91 Work Records/\` 루트에는 이 Work Records 허브만 둔다.
- \`90 Operations/\` 루트에는 Operations, Active Context, Runbook, Decision Log, Session Brief 같은 기준 문서만 둔다.
- 새 작업 단위 폴더나 기록 문서를 만들면 반드시 이 문서의 \`Records\` 섹션에 연결한다.
- \`📄\` 아이콘은 AI OS Wiki 파일명에 사용하지 않는다.

## Records

-
`);
}

function followUps(name, slug) {
  return note(`📕 ${slug} Follow-ups`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "follow-up", "operation", "hub"], `# ${slug} Follow-ups

개발, 배포, 운영 중 발견한 나중에 처리할 수정거리를 모으는 허브다.

## Rule

- 새 수정거리는 \`90 Operations/92 Follow-ups/📘 {Follow-up Title}.md\`로 별도 노트를 만든다.
- 발견한 작업 기록이나 배포 기록에는 이 Follow-up 노트 링크만 남긴다.
- 바로 고쳐야 하는 장애나 재사용 가능한 버그는 \`90 Operations/Issues/10 Issue Records/\`에도 이슈로 승격한다.
- 설계나 운영 기준이 바뀌면 \`📗 ${slug} Decision Log\`에도 남긴다.

## Pending

-

## Done

-
`);
}

function issueMap(name, slug) {
  return note(`📕 ${slug} Issue Map`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "issue-map", "issue", "hub"], `# ${slug} Issue Map

${name} 프로젝트에서 발생한 설치, 운영, QA, 런타임 이슈를 모으는 허브다.

## Ontology Relations

- node_type: issue_map
- contains: [[📗 ${slug} Installation Issues]], [[📕 ${slug} Issue Records]]

## Folder Structure

- \`00 Issue Rules/\`: 이슈 분류 인덱스
- \`10 Issue Records/\`: 실제 발생한 개별 이슈 내용과 \`📕 ${slug} Issue Records\` 허브

## Categories

- [[📗 ${slug} Installation Issues]]

## Issue Records

- [[📕 ${slug} Issue Records]]
`);
}

function issueCategory(name, slug) {
  return note(`📗 ${slug} Installation Issues`, `[[📕 ${slug} Issue Map]]`, ["ai-os", "llm-wiki", "project", slug, "installation", "issue"], `# ${slug} Installation Issues

설치, 배포, 현장 지원 중 발생한 이슈를 분류하는 인덱스다.

## Classification Rule

- 설치, 배포, 현장 지원 중 발생한 이슈를 이 분류에 넣는다.
- 실제 이슈 노트는 \`10 Issue Records/📕 ${slug} Issue Records\` 아래에 기록한다.
- 이 문서는 실제 이슈 노트를 직접 링크하지 않는다.

## Related

- 작성 템플릿: \`📗 Issue Note Template\`
`);
}

function issueRecords(name, slug) {
  return note(`📕 ${slug} Issue Records`, `[[📕 ${slug} Issue Map]]`, ["ai-os", "llm-wiki", "project", slug, "issue-records", "issue", "hub"], `# ${slug} Issue Records

실제 발생한 개별 이슈 내용만 모으는 허브다.

규칙, 템플릿, 분류 기준은 \`00 Issue Rules/\`에 두고, 이 문서 아래에는 실제 이슈 노트만 연결한다.

## Open Issues

-

## Closed Issues

-
`);
}

function pointerDoc(tool, name, projectRoot) {
  const markerName = tool.toUpperCase();
  return `<!-- AI_OS_WIKI_POINTER:${markerName}:START -->
## AI OS Wiki Pointer

This repository uses the Obsidian AI OS wiki as the long-term project memory.

Mandatory: read the project wiki before analyzing or changing behavior.

- ${path.join(projectRoot, `📒 ${path.basename(projectRoot)}.md`)}
- ${path.join(projectRoot, "90 Operations", `📗 ${path.basename(projectRoot)} Active Context.md`)}
- ${path.join(projectRoot, "90 Operations", `📗 ${path.basename(projectRoot)} Runbook.md`)}
- ${path.join(projectRoot, "90 Operations", `📗 ${path.basename(projectRoot)} Session Brief.md`)}
- ${path.join(projectRoot, "90 Operations", "Issues", `📕 ${path.basename(projectRoot)} Issue Map.md`)}
- ${path.join(projectRoot, "90 Operations", "Issues", "10 Issue Records", `📕 ${path.basename(projectRoot)} Issue Records.md`)}

Issue behavior:

- If the user reports an error, incident, install failure, field issue, screenshot, or log, do not stop at analysis.
- Create or update an issue note under Obsidian \`90 Operations/Issues/10 Issue Records\`.
- The issue note must include \`Error Signature\` and \`Recognition Rule\`.
- If you cannot write the issue note, explicitly say why in the final response.

Do not treat this file as the long-term memory store. It is only a pointer into Obsidian.

Project connection requirement:

- When this repository is newly connected to AI OS Wiki, inspect the repository and populate the Runbook only with information supported by real files or user-provided context.
- For executable software, cover installation, local execution, build, test, database, Docker or required services, ports, and required environment files.
- For documentation, portfolio, server-build, or knowledge projects, record the writing, publishing, deployment, or operating workflow instead of saying there is no run method.
- Do not overwrite existing human-written Runbook content unless the user asks for a refresh.
- Mark unverified values as \`Unverified\` instead of guessing.
<!-- AI_OS_WIKI_POINTER:${markerName}:END -->
`;
}

function issueRecordNote(issue) {
  return note(`📘 ${issue.title}`, `[[📕 ${issue.projectSlug} Issue Records]]`, ["ai-os", "llm-wiki", "project", issue.projectSlug, "issue", issue.category.toLowerCase()], [
    `# ${issue.title}`,
    "",
    "## Summary",
    "",
    issue.summary,
    "",
    "## Source",
    "",
    "- Reporter: 사용자 전달",
    "- Channel: AI session",
    `- Received At: ${issue.date}`,
    "- Attachments:",
    "",
    "## Error Signature",
    "",
    "이 로그/에러코드가 보이면 이 이슈가 발생한 것으로 본다.",
    "",
    "~~~text",
    issue.errorSignature,
    "~~~",
    "",
    "## Recognition Rule",
    "",
    `- ${issue.recognitionRule}`,
    "",
    "## Symptoms",
    "",
    "-",
    "",
    "## Impact",
    "",
    "-",
    "",
    "## Cause",
    "",
    "- Status: Unknown | Suspected | Confirmed",
    "- Details:",
    "",
    "## Investigation",
    "",
    "- Checked:",
    "- Excluded:",
    "- Need To Check:",
    "",
    "## Resolution",
    "",
    "-",
    "",
    "## Prevention",
    "",
    "-",
    "",
    "## Related",
    "",
    `- 📕 ${issue.projectSlug} Issue Records`,
    `- 분류 기준: 📗 ${issue.projectSlug} ${issue.category} Issues`,
    "",
  ].join("\n"));
}

function note(title, cmds, tags, body) {
  return `---
title: ${title}
CMDS: "${cmds}"
type:
  - note
tags:
${tags.map((tag) => `  - ${tag}`).join("\n")}
created: ${today()} 00:00
modified: ${today()} 00:00
---
${body}`;
}

function appendGitignore(context) {
  const file = path.join(context.projectPath, ".gitignore");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current.includes("# AI Wiki / LLM session pointers")) return;
  const next = `${current}${current.endsWith("\n") || current.length === 0 ? "" : "\n"}\n${IGNORE_BLOCK}`;
  writeFile(file, next, { ...context, force: true });
}

function upsertPointerDocs(context) {
  const pointers = [
    ["CODEX.md", "Codex"],
    ["CLAUDE.md", "Claude"],
    ["GEMINI.md", "Gemini"],
  ];

  for (const [fileName, tool] of pointers) {
    const file = path.join(context.projectPath, fileName);
    const content = pointerDoc(tool, context.projectName, context.projectRoot);
    upsertManagedBlock(file, content, `AI_OS_WIKI_POINTER:${tool.toUpperCase()}`, context);
  }
}

function upsertManagedBlock(file, block, marker, context) {
  if (context.dryRun) {
    console.log(`[dry-run] upsert ${file} ${marker}`);
    return;
  }

  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`);
  const normalizedBlock = block.endsWith("\n") ? block : `${block}\n`;
  const next = current.includes(start) && current.includes(end)
    ? current.replace(pattern, normalizedBlock)
    : `${current.trimEnd()}${current.trimEnd() ? "\n\n" : ""}${normalizedBlock}`;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  console.log(fs.existsSync(file) && current ? `[update] ${file}` : `[write] ${file}`);
}

function appendProjectWikiConnector(context) {
  const file = path.join(context.vault, "10.Guideline", "connector", PROJECT_WIKI_CONNECTOR_FILE);
  if (!fs.existsSync(file)) return;
  const link = `[[${AI_OS_DIR}/Projects/${context.projectSlug}/📒 ${context.projectSlug}|📒 ${context.projectSlug}]]`;
  const current = fs.readFileSync(file, "utf8");
  if (current.includes(link)) return;
  writeFile(file, `${current.trimEnd()}\n- ${link}\n`, { ...context, force: true });
}

function appendIssueRecord(file, noteTitle, context) {
  const link = `[[${noteTitle}]]`;
  if (!fs.existsSync(file)) {
    writeFile(file, issueRecords(context.projectName, context.projectSlug), context);
  }
  if (context.dryRun) {
    console.log(`[dry-run] update ${file} with ${link}`);
    return;
  }
  const current = fs.readFileSync(file, "utf8");
  if (current.includes(link)) return;
  const next = current.includes("## Open Issues")
    ? current.replace(/## Open Issues\n\n-\s*(\n|$)/, `## Open Issues\n\n- ${link}\n`)
    : `${current.trimEnd()}\n\n## Open Issues\n\n- ${link}\n`;
  writeFile(file, next, { ...context, force: true });
}

function writeFile(file, content, context) {
  if (context.dryRun) {
    console.log(`[dry-run] write ${file}`);
    return;
  }
  if (fs.existsSync(file) && !context.force) {
    console.log(`[skip] exists ${file}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log(`[write] ${file}`);
}

function log(context, message) {
  console.log(context.dryRun ? `[dry-run] ${message}` : message);
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function toKebab(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferProjectName(projectPath) {
  return path.basename(projectPath);
}

function isHomeDirectory(projectPath) {
  return path.resolve(projectPath) === path.resolve(os.homedir());
}

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    fail(`Invalid config file: ${CONFIG_FILE}`);
  }
}

function resolveVault(args) {
  const config = readConfig();
  const candidates = [
    args.vault,
    process.env.AI_OS_VAULT,
    config.vault,
    fs.existsSync(DEFAULT_VAULT) ? DEFAULT_VAULT : "",
  ].filter(Boolean);

  const vault = candidates[0] ? path.resolve(candidates[0]) : "";

  if (!vault) {
    fail([
      "Missing Obsidian vault path.",
      "",
      "Provide one of:",
      "  ai-os setup --vault /path/to/vault",
      "  AI_OS_VAULT=/path/to/vault ai-os setup",
      "  ai-os config set-vault --vault /path/to/vault",
    ].join("\n"));
  }

  if (!fs.existsSync(vault)) {
    fail(`Vault path does not exist: ${vault}`);
  }

  return vault;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

main();
