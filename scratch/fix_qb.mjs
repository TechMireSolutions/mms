import fs from 'fs';

let qb = fs.readFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', 'utf8');

qb = qb.replace(/const typeConfigItem = config\.types\.find\(t => t\.id === question\.type\);\n  const diffConfigItem = config\.difficulties\.find\(d => d\.id === question\.difficulty\);/, "");
qb = qb.replace(/value=\{typeConfigItem\?\.label \|\| question\.type\}/, "value={config.typeLabel?.(question.type) || question.type}");
qb = qb.replace(/value=\{diffConfigItem\?\.label \|\| question\.difficulty\}/, "value={config.difficultyLabel?.(question.difficulty) || question.difficulty}");

fs.writeFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', qb);
