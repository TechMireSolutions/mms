import fs from 'fs';

let examPagePath = 'apps/frontend/src/tenant/features/examinations/ExaminationsPage.tsx';
let examPage = fs.readFileSync(examPagePath, 'utf8');
examPage = examPage.replace(/const e = c.exams.find\(ex => ex.id === id\);/g, "const e = c.exams.find((ex: any) => ex.id === id);");
examPage = examPage.replace(/statusConfig=\{c\.examinationsConfig\.statuses\}\n/g, "");
fs.writeFileSync(examPagePath, examPage);

let examDetailPath = 'apps/frontend/src/tenant/features/examinations/components/ExaminationDetail.tsx';
let examDetail = fs.readFileSync(examDetailPath, 'utf8');
examDetail = examDetail.replace(/subtitle=\{exam\.code\}/, "subtitle={undefined}");
examDetail = examDetail.replace(/t\('examinations\.fields\.description', \{ defaultValue: 'Description' \}\)/g, "t('examinations.fields.description' as any)");
examDetail = examDetail.replace(/value=\{statusItem \? <StatusBadge config=\{statusItem as any\} \/> : '—'\}/, "value={exam.status || '—'}");
examDetail = examDetail.replace(/const statusItem = exam\.status \? statusConfig\[exam\.status\] : undefined;/g, "");
examDetail = examDetail.replace(/statusConfig: Record<string, StatusBadgeConfigItem>;/g, "");
examDetail = examDetail.replace(/  statusConfig,\n/g, "");
fs.writeFileSync(examDetailPath, examDetail);

let qbDetailPath = 'apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx';
let qbDetail = fs.readFileSync(qbDetailPath, 'utf8');
qbDetail = qbDetail.replace(/<DetailSectionTitle>\{t\('questionBank\.fields\.content', \{ defaultValue: 'Question Content' \}\)\}<\/DetailSectionTitle>/g, "<DetailSectionTitle>{t('questionBank.fields.content' as any)}</DetailSectionTitle>");
qbDetail = qbDetail.replace(/<DetailSectionTitle>\{t\('questionBank\.fields\.explanation', \{ defaultValue: 'Explanation' \}\)\}<\/DetailSectionTitle>/g, "<DetailSectionTitle>{t('questionBank.fields.explanation' as any)}</DetailSectionTitle>");
qbDetail = qbDetail.replace(/<div className="prose prose-sm max-w-none text-foreground dark:prose-invert" dangerouslySetInnerHTML=\{\{ __html: question\.content\.text \}\} \/>/g, '<div className="prose prose-sm max-w-none text-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: question.text }} />');
qbDetail = qbDetail.replace(/<div className="prose prose-sm max-w-none text-foreground dark:prose-invert" dangerouslySetInnerHTML=\{\{ __html: question\.explanation\.text \}\} \/>/g, '<div className="prose prose-sm max-w-none text-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: question.answer }} />');
qbDetail = qbDetail.replace(/\{question\.explanation\?\.text && \(/g, "{question.answer && (");
fs.writeFileSync(qbDetailPath, qbDetail);
