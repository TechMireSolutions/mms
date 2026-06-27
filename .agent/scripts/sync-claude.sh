#!/usr/bin/env bash
# Sync .cursor/rules/*.mdc → .claude/rules/*.md (Claude Code paths frontmatter).
# Sync .agent/skills/ → .claude/skills/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

node <<'SCRIPT'
const fs = require("fs");
const path = require("path");

const cursorDir = ".cursor/rules";
const claudeRulesDir = ".claude/rules";
const agentsSkillsDir = ".agent/skills";
const claudeSkillsDir = ".claude/skills";

fs.mkdirSync(claudeRulesDir, { recursive: true });

// Prune orphaned rule files in claudeRulesDir
const cursorRules = new Set(
  fs.readdirSync(cursorDir)
    .filter((f) => f.endsWith(".mdc"))
    .map((f) => f.replace(/\.mdc$/, ""))
);

for (const file of fs.readdirSync(claudeRulesDir).filter((f) => f.endsWith(".md") && f !== "README.md")) {
  const base = file.replace(/\.md$/, "");
  if (!cursorRules.has(base)) {
    fs.unlinkSync(path.join(claudeRulesDir, file));
    console.log(`pruned orphaned claude rule: ${file}`);
  }
}

for (const file of fs.readdirSync(cursorDir).filter((f) => f.endsWith(".mdc"))) {
  const base = file.replace(/\.mdc$/, "");
  const src = fs.readFileSync(path.join(cursorDir, file), "utf8");
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`No frontmatter: ${file}`);
  const front = match[1];
  const body = match[2].replace(/^\s+/, "").replace(/\.mdc\b/g, ".md");
  const alwaysApply = /alwaysApply:\s*true/.test(front);
  const descMatch = front.match(/^description:\s*(.+)$/m);
  const globsMatch = front.match(/^globs:\s*(.+)$/m);

  const lines = ["---"];
  if (descMatch) lines.push(`description: ${descMatch[1].trim()}`);
  if (!alwaysApply && globsMatch) {
    const paths = globsMatch[1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (paths.length > 0) {
      lines.push("paths:");
      for (const p of paths) lines.push(`  - "${p}"`);
    }
  }
  lines.push("---", "", body);
  const out = lines.join("\n");
  fs.writeFileSync(path.join(claudeRulesDir, `${base}.md`), out.endsWith("\n") ? out : `${out}\n`);
  console.log(`synced rule ${base}.md`);
}
SCRIPT

# Prune orphaned skill directories in .claude/skills
if [[ -d "$ROOT/.claude/skills" ]]; then
  for dir in "$ROOT/.claude/skills"/*/; do
    if [[ -d "$dir" ]]; then
      name="$(basename "$dir")"
      if [[ ! -d "$ROOT/.agent/skills/$name" ]]; then
        rm -rf "$dir"
        echo "pruned orphaned claude skill: $name"
      fi
    fi
  done
fi

for dir in "$ROOT/.agent/skills"/*/; do
  name="$(basename "$dir")"
  mkdir -p "$ROOT/.claude/skills/$name"
  if [[ -f "$dir/SKILL.md" ]]; then
    cp "$dir/SKILL.md" "$ROOT/.claude/skills/$name/SKILL.md"
    echo "synced skill $name"
  fi
  if [[ -d "$dir/scripts" ]]; then
    mkdir -p "$ROOT/.claude/skills/$name/scripts"
    cp -R "$dir/scripts/." "$ROOT/.claude/skills/$name/scripts/"
    echo "synced scripts $name"
  fi
done

cp "$ROOT/.agent/rules/README.md" "$ROOT/.claude/rules/README.md" 2>/dev/null || true
cp "$ROOT/.agent/skills/README.md" "$ROOT/.claude/skills/README.md"

mkdir -p "$ROOT/.claude/docs/workflows"
cp "$ROOT/.agent/workflows/"*.md "$ROOT/.claude/docs/workflows/" 2>/dev/null || true

echo "Done. Claude mirror: .claude/rules/ + .claude/skills/"
