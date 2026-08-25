import fs from 'fs';

let examPath = 'apps/frontend/src/tenant/features/examinations/components/ExaminationDetail.tsx';
let exam = fs.readFileSync(examPath, 'utf8');

exam = exam.replace(/t\('common\.restore', \{ defaultValue: 'Restore' \}\) as any/g, "t('common.restore' as any)");
exam = exam.replace(/t\('common\.edit', \{ defaultValue: 'Edit' \}\) as any/g, "t('common.edit' as any)");
exam = exam.replace(/t\('examinations\.detail\.overview', \{ defaultValue: 'Overview' \}\) as any/g, "t('examinations.detail.overview' as any)");
exam = exam.replace(/t\('examinations\.fields\.status', \{ defaultValue: 'Status' \}\) as any/g, "t('examinations.fields.status' as any)");
exam = exam.replace(/t\('examinations\.fields\.date', \{ defaultValue: 'Date' \}\) as any/g, "t('examinations.fields.date' as any)");
exam = exam.replace(/t\('examinations\.fields\.classTargets', \{ defaultValue: 'Classes' \}\) as any/g, "t('examinations.fields.classTargets' as any)");
exam = exam.replace(/t\('examinations\.fields\.description', \{ defaultValue: 'Description' \}\) as any/g, "t('examinations.fields.description' as any)");
exam = exam.replace(/<StatusBadge config=\{statusItem\} \/>/g, "<StatusBadge config={statusItem as any} />");

fs.writeFileSync(examPath, exam);

let qbPath = 'apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx';
let qb = fs.readFileSync(qbPath, 'utf8');

qb = qb.replace(/t\('questionBank\.detail\.title', \{ defaultValue: 'Question Details' \}\) as any/g, "t('questionBank.detail.title' as any)");
qb = qb.replace(/t\('common\.restore', \{ defaultValue: 'Restore' \}\) as any/g, "t('common.restore' as any)");
qb = qb.replace(/t\('common\.edit', \{ defaultValue: 'Edit' \}\) as any/g, "t('common.edit' as any)");
qb = qb.replace(/t\('questionBank\.detail\.overview', \{ defaultValue: 'Overview' \}\) as any/g, "t('questionBank.detail.overview' as any)");
qb = qb.replace(/t\('questionBank\.fields\.type', \{ defaultValue: 'Type' \}\) as any/g, "t('questionBank.fields.type' as any)");
qb = qb.replace(/t\('questionBank\.fields\.difficulty', \{ defaultValue: 'Difficulty' \}\) as any/g, "t('questionBank.fields.difficulty' as any)");
qb = qb.replace(/t\('questionBank\.fields\.category', \{ defaultValue: 'Category' \}\) as any/g, "t('questionBank.fields.category' as any)");
qb = qb.replace(/t\('questionBank\.fields\.marks', \{ defaultValue: 'Marks' \}\) as any/g, "t('questionBank.fields.marks' as any)");
qb = qb.replace(/t\('questionBank\.fields\.content', \{ defaultValue: 'Content' \}\) as any/g, "t('questionBank.fields.content' as any)");
qb = qb.replace(/t\('questionBank\.fields\.explanation', \{ defaultValue: 'Explanation' \}\) as any/g, "t('questionBank.fields.explanation' as any)");

qb = qb.replace(/<CategoryColorChip key=\{catId\} categoryId=\{catId\} name=\{catId\} \/>/g, 
  "<CategoryColorChip key={catId} name={config.categories.find(c => c.id === catId)?.name || catId} color={config.categories.find(c => c.id === catId)?.color || '#ccc'} />");

qb = qb.replace(/<p className="whitespace-pre-wrap text-sm text-foreground m-0">\{question\.content\}<\/p>/g, 
  '<p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.text}</p>');

qb = qb.replace(/<p className="whitespace-pre-wrap text-sm text-foreground m-0">\{question\.explanation\}<\/p>/g, 
  '<p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.answer}</p>');

qb = qb.replace(/\{question\.content && \([\s\S]*?<\/section>\s*\)}/g, 
`{question.text && (
          <section>
            <DetailSectionTitle>{t('questionBank.fields.content' as any)}</DetailSectionTitle>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.text}</p>
            </Card>
          </section>
        )}`);

qb = qb.replace(/\{question\.explanation && \([\s\S]*?<\/section>\s*\)}/g, 
`{question.answer && (
          <section>
            <DetailSectionTitle>{t('questionBank.fields.explanation' as any)}</DetailSectionTitle>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.answer}</p>
            </Card>
          </section>
        )}`);

fs.writeFileSync(qbPath, qb);
