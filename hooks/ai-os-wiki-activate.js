#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookEventName = process.argv[2] || "SessionStart";
const instructions = `AI OS WIKI ACTIVE

${fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")}`;

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
