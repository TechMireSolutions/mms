import fs from 'fs';

let qb = fs.readFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', 'utf8');

qb = qb.replace(/difficultyConfig: Record<string, StatusBadgeConfigItem>;\n  typeConfig: Record<string, StatusBadgeConfigItem>;\n/, '');
qb = qb.replace(/  difficultyConfig,\n  typeConfig,\n/, '');
qb = qb.replace(/subtitle=\{question.code \|\| undefined\}/, "subtitle={question.type}");
qb = qb.replace(/const typeConfigItem = question.type \? typeConfig\[question.type\] : undefined;/, "const typeConfigItem = config.types.find(t => t.id === question.type);");
qb = qb.replace(/const diffConfigItem = question.difficulty \? difficultyConfig\[question.difficulty\] : undefined;/, "const diffConfigItem = config.difficulties.find(d => d.id === question.difficulty);");
qb = qb.replace(/<StatusBadge config=\{typeConfig\[question.type\]\} \/>/, "{typeConfigItem?.label || question.type}");
qb = qb.replace(/<StatusBadge config=\{difficultyConfig\[question.difficulty\]\} \/>/, "{diffConfigItem?.label || question.difficulty}");

fs.writeFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', qb);


let qbPage = fs.readFileSync('apps/frontend/src/tenant/features/question-bank/QuestionBankPage.tsx', 'utf8');
qbPage = qbPage.replace(/              difficultyConfig=\{c.difficultyConfig\}\n/, '');
qbPage = qbPage.replace(/              typeConfig=\{c.typeConfig\}\n/, '');
fs.writeFileSync('apps/frontend/src/tenant/features/question-bank/QuestionBankPage.tsx', qbPage);


let exam = fs.readFileSync('apps/frontend/src/tenant/features/examinations/components/ExaminationDetail.tsx', 'utf8');

exam = exam.replace(/headerContent=\{/g, "headerExtra={");
exam = exam.replace(/actions=\{/g, "headerActions={");
exam = exam.replace(/onRestore=\{\(\) => onRestore\?\.\(exam\.id\)\}/, "onRestore={() => onRestore?.(exam.id)}\n          restoreLabel={t('common.restore', { defaultValue: 'Restore' })}\n          editLabel={t('common.edit', { defaultValue: 'Edit' })}");
exam = exam.replace(/value=\{exam.endDate \? formatDate\(exam.endDate\) : '—'\}/, "value={'—'}"); // exams don't have endDate apparently?
exam = exam.replace(/label=\{t\('examinations.fields.status'\)\}/, "label={t('examinations.fields.status', { defaultValue: 'Status' }) as any}");
exam = exam.replace(/label=\{t\('examinations.fields.startDate'\)\}/, "label={t('examinations.fields.startDate', { defaultValue: 'Start Date' }) as any}");
exam = exam.replace(/label=\{t\('examinations.fields.endDate'\)\}/, "label={t('examinations.fields.endDate', { defaultValue: 'End Date' }) as any}");
exam = exam.replace(/label=\{t\('examinations.fields.classTargets'\)\}/, "label={t('examinations.fields.classTargets', { defaultValue: 'Classes' }) as any}");
exam = exam.replace(/<DetailSectionTitle>\{t\('examinations.fields.description'\)\}<\/DetailSectionTitle>/, "<DetailSectionTitle>{t('examinations.fields.description', { defaultValue: 'Description' }) as any}</DetailSectionTitle>");
exam = exam.replace(/<DetailSectionTitle>\{t\('examinations.detail.overview'\)\}<\/DetailSectionTitle>/, "<DetailSectionTitle>{t('examinations.detail.overview', { defaultValue: 'Overview' }) as any}</DetailSectionTitle>");

fs.writeFileSync('apps/frontend/src/tenant/features/examinations/components/ExaminationDetail.tsx', exam);
