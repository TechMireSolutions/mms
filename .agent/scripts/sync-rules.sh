#!/usr/bin/env bash
# Sync .cursor/rules/*.mdc → .agent/rules/*.md (body-identical; frontmatter differs).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

node <<'SCRIPT'
const fs = require("fs");
const path = require("path");

const cursorDir = ".cursor/rules";
const agentsDir = ".agent/rules";

// Prune orphaned rule files in agentsDir
const cursorRules = new Set(
  fs.readdirSync(cursorDir)
    .filter((f) => f.endsWith(".mdc"))
    .map((f) => f.replace(/\.mdc$/, ""))
);

for (const file of fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md") && f !== "README.md")) {
  const base = file.replace(/\.md$/, "");
  if (!cursorRules.has(base)) {
    fs.unlinkSync(path.join(agentsDir, file));
    console.log(`pruned orphaned rule: ${file}`);
  }
}

for (const file of fs.readdirSync(cursorDir).filter((f) => f.endsWith(".mdc"))) {
  const base = file.replace(/\.mdc$/, "");
  const src = fs.readFileSync(path.join(cursorDir, file), "utf8");
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`No frontmatter: ${file}`);
  const front = match[1];
  const body = match[2].replace(/^\s+/, "");
  const trigger = /alwaysApply:\s*true/.test(front) ? "always_on" : "model_decision";
  const agentBody = body.replace(/\.mdc\b/g, ".md");
  const out = `---\ntrigger: ${trigger}\n---\n\n${agentBody}`;
  fs.writeFileSync(path.join(agentsDir, `${base}.md`), out.endsWith("\n") ? out : `${out}\n`);
  console.log(`synced ${base}.md`);
}

// Sync README.md from .cursor/rules/README.md to .agent/rules/README.md
const readmePath = path.join(cursorDir, "README.md");
if (fs.existsSync(readmePath)) {
  const readmeContent = fs.readFileSync(readmePath, "utf8");
  const translatedReadme = readmeContent.replace(/\.mdc\b/g, ".md");
  fs.writeFileSync(path.join(agentsDir, "README.md"), translatedReadme, "utf8");
  console.log("synced README.md");
}
SCRIPT

echo "Done. Verify: diff bodies or run PR checklist in .cursor/rules/README.md"
