#!/usr/bin/env bash
# Sync .cursor/rules/*.mdc → .agent/rules/*.md (body-identical; frontmatter differs).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done
export MMS_SYNC_DRY_RUN="$DRY_RUN"

node <<'SCRIPT'
const fs = require("fs");
const path = require("path");

const DRY = process.env.MMS_SYNC_DRY_RUN === "1";
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
    if (!DRY) fs.unlinkSync(path.join(agentsDir, file));
    console.log(`${DRY ? "would prune" : "pruned"} orphaned rule: ${file}`);
  }
}

for (const file of fs.readdirSync(cursorDir).filter((f) => f.endsWith(".mdc"))) {
  const base = file.replace(/\.mdc$/, "");
  const src = fs.readFileSync(path.join(cursorDir, file), "utf8");
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`No frontmatter: ${file}`);
  const front = match[1];
  const body = match[2].replace(/^\s+/, "");
  const descMatch = front.match(/^description:\s*(.+)$/m);
  const trigger = /alwaysApply:\s*true/.test(front) ? "always_on" : "model_decision";
  // Rewrite RULE-NAME references (*.mdc -> *.md) but never a Cursor directory path
// (`.cursor/rules/*.mdc` must keep its real extension in the mirrors).
  const agentBody = body.replace(/(?<!\.cursor\/rules\/)\b([a-z0-9-]+)\.mdc\b/g, "$1.md");
  const frontLines = ["---", `trigger: ${trigger}`];
  if (descMatch) {
    frontLines.push(`description: ${descMatch[1].trim()}`);
  }
  frontLines.push("---");
  const out = `${frontLines.join("\n")}\n\n${agentBody}`;
  fs.writeFileSync(path.join(agentsDir, `${base}.md`), out.endsWith("\n") ? out : `${out}\n`);
  console.log(`${DRY ? "would write" : "synced"} ${base}.md`);
}

// Sync README.md from .cursor/rules/README.md to .agent/rules/README.md
const readmePath = path.join(cursorDir, "README.md");
if (fs.existsSync(readmePath)) {
  const readmeContent = fs.readFileSync(readmePath, "utf8");
  // Convert rule filenames (.mdc → .md) but keep prose that documents Cursor's .mdc extension.
  const translatedReadme = readmeContent
    .replace(/\.mdc\b/g, ".md")
    .replace(
      /Cross-references use `\.md` in Cursor, `\.md` elsewhere\./g,
      "Cross-references use `.mdc` in Cursor, `.md` elsewhere."
    )
    .replace(
      /\.cursor\/rules\/\*\.md\b/g,
      ".cursor/rules/*.mdc"
    )
    .replace(
      /`(\.\/)?\.cursor\/rules\/([^`]*)\.md`/g,
      "`$1.cursor/rules/$2.mdc`"
    )
    .replace(/^# MMS Cursor Rules\b/m, "# MMS Agent Rules")
    .replace(
      /Cursor loads `\.md` files from this directory automatically\./g,
      "Antigravity loads `.md` files from this directory (synced from Cursor `.mdc`)."
    );
  if (!DRY) fs.writeFileSync(path.join(agentsDir, "README.md"), translatedReadme, "utf8");
  console.log("synced README.md");
}
SCRIPT

echo "Done. Verify: diff bodies or run PR checklist in .cursor/rules/README.md"
