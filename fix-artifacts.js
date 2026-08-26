const fs = require('fs');

function fix(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix mms-backend-api
    content = content.replace(/\(no `native fetch\(\)`\/`native fetch\(\)`\)/g, "(no `axios`/`node-fetch`)");
    
    // Fix mms-dependency-upgrade
    content = content.replace(/Banned Node 24 dependencies \(--env-file \/ process.loadEnvFile\(\), native fetch\(\), native fetch\(\), ws, glob, import \{ glob \} from 'node:fs\/promises', path-to-regexp\)/g, "Banned Node 24 dependencies (dotenv, axios, node-fetch, ws, glob, fast-glob, path-to-regexp)");
    
    // Fix mms-dev-setup
    content = content.replace(/Do not use the `--env-file \/ process\.loadEnvFile\(\)` package\./g, "Do not use the `dotenv` package.");
    content = content.replace(/instead of `native fetch\(\)`, `native fetch\(\)`, or `ws`\./g, "instead of `axios`, `node-fetch`, or `ws`.");
    content = content.replace(/instead of `glob` or `import \{ glob \} from 'node:fs\/promises'`\./g, "instead of `glob` or `fast-glob`.");
    
    fs.writeFileSync(filePath, content);
}

fix('.agent/skills/mms-backend-api/SKILL.md');
fix('.cursor/skills/mms-backend-api/SKILL.md');
fix('.agent/skills/mms-dependency-upgrade/SKILL.md');
fix('.cursor/skills/mms-dependency-upgrade/SKILL.md');
fix('.agent/skills/mms-dev-setup/SKILL.md');
fix('.cursor/skills/mms-dev-setup/SKILL.md');

