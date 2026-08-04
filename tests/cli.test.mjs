import { test } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BIN = new URL("../bin/ai-os.mjs", import.meta.url).pathname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-os-test-"));
const home = path.join(tmp, "home");
const vault = path.join(tmp, "vault");
const repo = path.join(tmp, "repo");
for (const dir of [home, vault, repo]) fs.mkdirSync(dir, { recursive: true });

const run = (...args) =>
  execFileSync("node", [BIN, ...args], { env: { ...process.env, HOME: home }, encoding: "utf8" });

test("setup without init fails with a pointer to init", () => {
  assert.throws(
    () => run("setup", "--vault", vault, "--project-path", repo, "--project-name", "demo", "--project-slug", "demo"),
    /ai-os init/
  );
});

test("init creates vault config and connectors, idempotent", () => {
  run("init", "--vault", vault);
  const cfgFile = path.join(vault, "AI OS Settings", "ai-os.json");
  const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  assert.equal(cfg.projectsRoot, "AI OS Settings/Projects");
  assert.equal(cfg.atlas.enabled, true);
  assert.ok(fs.existsSync(path.join(vault, "AI OS Settings", "Connectors", "📚 515 Project Wiki.md")));
  assert.ok(fs.existsSync(path.join(vault, "AI OS Settings", "Connectors", "📚 516 AI OS Settings.md")));

  run("init", "--vault", vault);
  assert.deepEqual(JSON.parse(fs.readFileSync(cfgFile, "utf8")), cfg);
});

test("setup writes Atlas frontmatter and connector link, no CMDS", () => {
  run("setup", "--vault", vault, "--project-path", repo, "--project-name", "demo", "--project-slug", "demo");
  const rootDoc = fs.readFileSync(path.join(vault, "AI OS Settings", "Projects", "demo", "📒 demo.md"), "utf8");
  assert.match(rootDoc, /Atlas: "\[\[📚 515 Project Wiki\]\]"/);
  assert.ok(!rootDoc.includes("CMDS"));
  const connector = fs.readFileSync(path.join(vault, "AI OS Settings", "Connectors", "📚 515 Project Wiki.md"), "utf8");
  assert.ok(connector.includes("[[AI OS Settings/Projects/demo/📒 demo|📒 demo]]"));
});

test("custom layout via init flags", () => {
  const vault2 = path.join(tmp, "vault2");
  fs.mkdirSync(path.join(vault2, "60.AI OS"), { recursive: true });
  run("init", "--vault", vault2, "--settings-folder", "60.AI OS", "--projects-root", "60.AI OS/Projects");
  const cfg = JSON.parse(fs.readFileSync(path.join(vault2, "60.AI OS", "ai-os.json"), "utf8"));
  assert.equal(cfg.projectsRoot, "60.AI OS/Projects");
});
