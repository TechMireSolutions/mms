#!/usr/bin/env bash
# Sync .cursor/rules/*.mdc → .agents/rules/*.md (body-identical; frontmatter differs).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

node <<'SCRIPT'
const fs = require("fs");
const path = require("path");

const cursorDir = ".cursor/rules";
const agentsDir = ".agents/rules";

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
SCRIPT

echo "Done. Verify: diff bodies or run PR checklist in .cursor/rules/README.md"
