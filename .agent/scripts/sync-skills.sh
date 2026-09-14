#!/usr/bin/env bash
# Sync .agent/skills/ → .cursor/skills/ (canonical Antigravity → Cursor).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

node <<'SCRIPT'
const fs = require("fs");
const path = require("path");

const src = ".agent/skills";
const dest = ".cursor/skills";

// Helper to translate rule references from .md to .mdc
function translateRuleRefs(content) {
  return content.replace(/\b(mms-[a-z0-9-]+|antigravity-global|saas-architecture)\.md\b/g, "$1.mdc");
}

// Prune orphaned skill directories in dest
const srcSkills = new Set(
  fs.readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
);

if (fs.existsSync(dest)) {
  for (const entry of fs.readdirSync(dest, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const name = entry.name;
      if (!srcSkills.has(name)) {
        fs.rmSync(path.join(dest, name), { recursive: true, force: true });
        console.log(`pruned orphaned skill: ${name}`);
      }
    }
  }
}

for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    const name = entry.name;
    const srcDir = path.join(src, name);
    const destDir = path.join(dest, name);
    fs.mkdirSync(destDir, { recursive: true });

    const skillFile = path.join(srcDir, "SKILL.md");
    if (fs.existsSync(skillFile)) {
      const content = fs.readFileSync(skillFile, "utf8");
      const updated = translateRuleRefs(content);
      fs.writeFileSync(path.join(destDir, "SKILL.md"), updated, "utf8");
      console.log(`synced skill ${name}`);
    }

    const subdirs = ["scripts", "references", "examples"];
    for (const sub of subdirs) {
      const subDir = path.join(srcDir, sub);
      if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
        const destSubDir = path.join(destDir, sub);
        fs.mkdirSync(destSubDir, { recursive: true });
        for (const file of fs.readdirSync(subDir)) {
          fs.copyFileSync(
            path.join(subDir, file),
            path.join(destSubDir, file)
          );
        }
        console.log(`synced ${sub} ${name}`);
      }
    }
  }
}

const readmeFile = path.join(src, "README.md");
if (fs.existsSync(readmeFile)) {
  const content = fs.readFileSync(readmeFile, "utf8");
  const updated = translateRuleRefs(content);
  fs.writeFileSync(path.join(dest, "README.md"), updated, "utf8");
}
SCRIPT

echo "Done. Skills mirrored to .cursor/skills"
