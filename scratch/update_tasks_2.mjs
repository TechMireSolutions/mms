import fs from 'fs';
let taskPath = '/Users/syedaalin/.gemini/antigravity-ide/brain/83e4716b-8416-47f4-9ea0-f6b7fda2926b/task.md';
let task = fs.readFileSync(taskPath, 'utf8');

task = task.replace(/- \[ \] Implement Detail Drawer for \*\*Hasanat\*\*/, "- [x] Implement Detail Drawer for **Hasanat**");

fs.writeFileSync(taskPath, task);
