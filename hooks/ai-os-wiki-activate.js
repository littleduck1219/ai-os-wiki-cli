#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookEventName = process.argv[2] || "SessionStart";

let firstRun = "";
try {
  const machine = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".ai-os-wiki-cli", "config.json"), "utf8"));
  if (!machine.vault) throw new Error("no vault");
} catch {
  firstRun = `

FIRST RUN: No Obsidian vault is configured on this machine. Before any AI OS Wiki work, ask the user for their Obsidian vault path, then run \`ai-os init --vault "/path/to/vault"\` (or \`npx github:littleduck1219/ai-os-wiki-cli init --vault ...\`). If the vault already has an AI OS layout, pass \`--settings-folder\` and \`--projects-root\` to match it instead of creating new folders.`;
}

const instructions = `AI OS WIKI ACTIVE

${fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")}${firstRun}`;

const isCodex = Boolean(process.env.PLUGIN_DATA);
const output = isCodex
  ? {
      systemMessage: "AI_OS_WIKI:ACTIVE",
      hookSpecificOutput: {
        hookEventName,
        additionalContext: instructions,
      },
    }
  : instructions;

process.stdout.write(typeof output === "string" ? output : JSON.stringify(output));
