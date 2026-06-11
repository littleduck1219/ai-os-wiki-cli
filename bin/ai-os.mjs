#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const AI_OS_DIR = "60.AI OS";
const MANAGED_PROJECTS = "📕 AI OS Managed Projects";
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
  --project-name   Display name, defaults to package.json name or folder name
  --project-slug   Folder slug, defaults to a slugified project name
  --project-path   Local repo/project path, defaults to current working directory
  --dry-run        Print actions without writing files
  --force          Overwrite existing generated wiki/pointer files
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
  --force          Overwrite existing generated wiki/pointer files
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
    [path.join(p, `📒 ${slug} Index.md`), projectIndex(n, slug, repo)],
    [path.join(p, "10 Features and Domains", `📕 ${slug} Features.md`), featureHub(n, slug)],
    [path.join(p, "20 Shared Assets", `📕 ${slug} Assets.md`), sharedHub(n, slug)],
    [path.join(p, "90 Operations", `📕 ${slug} Operations.md`), operationsHub(n, slug)],
    [path.join(p, "90 Operations", `📗 ${slug} Active Context.md`), activeContext(n, slug, repo)],
    [path.join(p, "90 Operations", `📗 ${slug} Decision Log.md`), decisionLog(n, slug)],
    [path.join(p, "90 Operations", `📗 ${slug} Session Brief.md`), sessionBrief(n, slug, repo)],
    [path.join(p, "90 Operations", "Issues", `📕 ${slug} Issue Map.md`), issueMap(n, slug)],
    [path.join(p, "90 Operations", "Issues", "00 Issue Rules", `📗 ${slug} Installation Issues.md`), issueCategory(n, slug)],
    [path.join(p, "90 Operations", "Issues", "10 Issue Records", `📕 ${slug} Issue Records.md`), issueRecords(n, slug)],
    [path.join(context.projectPath, "CODEX.md"), pointerDoc("Codex", n, p)],
    [path.join(context.projectPath, "CLAUDE.md"), pointerDoc("Claude", n, p)],
    [path.join(context.projectPath, "GEMINI.md"), pointerDoc("Gemini", n, p)],
  ]);
}

function buildProjectUpdates(context) {
  return [
    () => appendGitignore(context),
    () => appendManagedProject(context),
  ];
}

function projectIndex(name, slug, repo) {
  return note(`📒 ${slug} Index`, `[[${MANAGED_PROJECTS}]]`, ["ai-os", "llm-wiki", "project", slug, "project-index", "hub"], `# ${slug} Index

${name} 프로젝트의 LLM Wiki 인덱스다.

## Ontology Relations

- node_type: project
- contains: [[📕 ${slug} Features]], [[📕 ${slug} Assets]], [[📕 ${slug} Operations]]

## Repo

- \`${repo}\`

## Folder Structure

- root: 프로젝트 입구 문서만 둔다.
- \`10 Features and Domains/\`: 기능, 화면, 도메인 허브와 기능별 하위 폴더
- \`20 Shared Assets/\`: 공통 자산 허브와 자산 영역별 하위 폴더
- \`90 Operations/\`: 운영 허브, 상태, 결정, 세션 인계, 이슈 문서

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
  return note(`📕 ${slug} Features`, `[[📒 ${slug} Index]]`, ["ai-os", "llm-wiki", "project", slug, "feature-map", "hub"], `# ${slug} Features

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
  return note(`📕 ${slug} Assets`, `[[📒 ${slug} Index]]`, ["ai-os", "llm-wiki", "project", slug, "shared-assets", "asset-map", "hub"], `# ${slug} Assets

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
  return note(`📕 ${slug} Operations`, `[[📒 ${slug} Index]]`, ["ai-os", "llm-wiki", "project", slug, "operations", "operation", "hub"], `# ${slug} Operations

현재 상태, 결정 로그, 세션 인계, 이슈 운영 문서를 모으는 허브다.

## Documents

- [[📗 ${slug} Active Context]]
- [[📗 ${slug} Decision Log]]
- [[📗 ${slug} Session Brief]]
- [[📕 ${slug} Issue Map]]
`);
}

function activeContext(name, slug, repo) {
  return note(`📗 ${slug} Active Context`, `[[📕 ${slug} Operations]]`, ["ai-os", "llm-wiki", "project", slug, "active-context", "operation"], `# ${slug} Active Context

## Current Goal

-

## Structure Snapshot

- 프로젝트 입구: \`📒 ${slug} Index\`
- 기능 축 허브: \`📕 ${slug} Features\`
- 공통 자산 허브: \`📕 ${slug} Assets\`
- 운영 축 허브: \`📕 ${slug} Operations\`

## Current State

- repo 위치: \`${repo}\`

## Observed Issues

-

## Next Steps

1.
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
4. \`${path.join("60.AI OS/Projects", slug, `📒 ${slug} Index.md`)}\`
5. \`📗 ${slug} Active Context\`

## Issue Behavior

이슈, 설치 장애, 현장 에러, 스크린샷 분석을 전달받으면 답변으로 끝내지 않고 \`90 Operations/Issues/10 Issue Records\` 아래에 이슈 노트를 생성하고 Issue Map에 인덱싱한다.
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
  return `# ${tool} Project Pointer

This repository uses the Obsidian AI OS wiki as the long-term project memory.

Mandatory: read the project wiki before analyzing or changing behavior.

- ${path.join(projectRoot, `📒 ${path.basename(projectRoot)} Index.md`)}
- ${path.join(projectRoot, "90 Operations", `📗 ${path.basename(projectRoot)} Active Context.md`)}
- ${path.join(projectRoot, "90 Operations", `📗 ${path.basename(projectRoot)} Session Brief.md`)}
- ${path.join(projectRoot, "90 Operations", "Issues", `📕 ${path.basename(projectRoot)} Issue Map.md`)}
- ${path.join(projectRoot, "90 Operations", "Issues", "10 Issue Records", `📕 ${path.basename(projectRoot)} Issue Records.md`)}

Issue behavior:

- If the user reports an error, incident, install failure, field issue, screenshot, or log, do not stop at analysis.
- Create or update an issue note under Obsidian \`90 Operations/Issues/10 Issue Records\`.
- The issue note must include \`Error Signature\` and \`Recognition Rule\`.
- If you cannot write the issue note, explicitly say why in the final response.

Do not treat this file as the long-term memory store. It is only a pointer into Obsidian.
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

function appendManagedProject(context) {
  const file = path.join(context.vault, AI_OS_DIR, "📕 AI OS Managed Projects.md");
  if (!fs.existsSync(file)) return;
  const link = `[[Projects/${context.projectSlug}/📒 ${context.projectSlug} Index|📒 ${context.projectSlug} Index]]`;
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

function inferProjectName(projectPath) {
  const packageFile = path.join(projectPath, "package.json");
  if (fs.existsSync(packageFile)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf8"));
      if (typeof packageJson.name === "string" && packageJson.name.trim()) {
        return packageJson.name.trim();
      }
    } catch {
      // Fall back to the folder name when package.json is not valid JSON.
    }
  }
  return path.basename(projectPath);
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
