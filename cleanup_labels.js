const fs = require("fs");
const path = require("path");

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith(".tsx") || dirFile.endsWith(".ts")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const allFiles = walkSync(path.join(process.cwd(), "apps/frontend/src/tenant/features"));
allFiles.push(path.join(process.cwd(), "apps/frontend/src/hooks/useModuleColumnLayout.ts"));

for (const file of allFiles) {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  // Remove `ModuleColumnCustomizerLabels` import and usage
  if (content.includes("ModuleColumnCustomizerLabels")) {
    content = content.replace(/import\s+(type\s+)?\{\s*([^}]*,\s*)?ModuleColumnCustomizerLabels(,\s*[^}]*)?\s*\}\s+from\s+['"][^'"]+['"];?\n?/g, (match, p1, p2, p3) => {
       if (!p2 && !p3) return "";
       const newImports = [];
       if (p2) newImports.push(p2.replace(/,\s*$/, ""));
       if (p3) newImports.push(p3.replace(/^,\s*/, ""));
       if (newImports.length > 0) {
          return match.replace(/\{[^}]+\}/, `{ ${newImports.join(", ")} }`);
       }
       return "";
    });
    content = content.replace(/\s*labels:\s*ModuleColumnCustomizerLabels;?\n?/g, "\n");
    content = content.replace(/import type \{ ModuleColumnCustomizerLabels \} from.*?\n/, "");
  }
  
  // Replace `labels:` correctly
  // Only remove lines that literally start with optional whitespace, `labels:`, followed by anything up to a comma or newline, inside the object.
  // Using split \n and filter is safer
  const lines = content.split("\n");
  const newLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("labels:") && (trimmed.includes("customizerLabels") || trimmed.includes("columnCustomizerLabels") || trimmed.includes("Labels") || trimmed === "labels: columnCustomizer.labels," || trimmed === "labels: customizerLabels," || trimmed === "labels: columnCustomizerLabels," || trimmed === "labels,")) {
       return false;
    }
    if (trimmed === "customizerLabels: columnCustomizerLabels," || trimmed === "customizerLabels: userColumnCustomizerLabels," || trimmed === "customizerLabels," || trimmed === "columnCustomizerLabels,") {
       return false;
    }
    if (trimmed === "customizerLabels?: ModuleColumnCustomizerLabels;") return false;
    if (trimmed.startsWith("customizerLabels: typeof customizerLabels") || trimmed === "customizerLabels?: any;") return false;
    
    // if the line has `labels: labels,` or `labels,` where it's part of props
    if (trimmed === "labels: customizerLabels," || trimmed === "labels: baseLabels," || trimmed === "labels: columnCustomizerLabels,") return false;
    
    // remove translationPrefix
    if (trimmed === "translationPrefix?: string;") return false;
    if (trimmed.startsWith("translationPrefix:")) return false;

    return true;
  });
  
  content = newLines.join("\n");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Cleaned ${file}`);
  }
}
