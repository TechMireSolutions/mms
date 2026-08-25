import fs from 'fs';
let taskPath = '/Users/syedaalin/.gemini/antigravity-ide/brain/83e4716b-8416-47f4-9ea0-f6b7fda2926b/task.md';
let task = fs.readFileSync(taskPath, 'utf8');

task = task.replace(/- \[ \] Hasanat \(Distributions\) File Renames/g, "- [x] Hasanat (Distributions) File Renames");
task = task.replace(/- \[ \] Finance \(Payments\) File Renames/g, "- [x] Finance (Payments) File Renames");
task = task.replace(/- \[ \] Finance \(Invoices\) File Renames/g, "- [x] Finance (Invoices) File Renames");
task = task.replace(/- \[ \] Examinations \(Exams\) File Renames/g, "- [x] Examinations (Exams) File Renames");
task = task.replace(/- \[ \] Question Bank \(Questions\) File Renames/g, "- [x] Question Bank (Questions) File Renames");
task = task.replace(/- \[ \] Update imports across the codebase/g, "- [x] Update imports across the codebase");
task = task.replace(/- \[ \] Run typecheck to verify all imports are correct/g, "- [x] Run typecheck to verify all imports are correct");

fs.writeFileSync(taskPath, task);
