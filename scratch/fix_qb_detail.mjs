import fs from 'fs';

let content = fs.readFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', 'utf8');

content = content.replace(/title=\{t\('questionBank.detail.title'\)\}/, "title={t('questionBank.detail.title', { defaultValue: 'Question Details' }) as any}");
content = content.replace(/subtitle=\{question.code\}/, "subtitle={question.type}");
content = content.replace(/headerContent=\{/g, "headerExtra={");
content = content.replace(/actions=\{/g, "headerActions={");
content = content.replace(/onRestore=\{\(\) => onRestore\?\.\(question\.id\)\}/, "onRestore={() => onRestore?.(question.id)}\n          restoreLabel={t('common.restore', { defaultValue: 'Restore' })}\n          editLabel={t('common.edit', { defaultValue: 'Edit' })}");

content = content.replace(/label=\{t\('questionBank.detail.overview'\)\}/, "label={t('questionBank.detail.overview', { defaultValue: 'Overview' }) as any}");
content = content.replace(/label=\{t\('questionBank.fields.type'\)\}/, "label={t('questionBank.fields.type', { defaultValue: 'Type' }) as any}");
content = content.replace(/value=\{<StatusBadge config=\{typeConfig\[question.type\]\} \/>\}/, "value={question.type}");
content = content.replace(/label=\{t\('questionBank.fields.difficulty'\)\}/, "label={t('questionBank.fields.difficulty', { defaultValue: 'Difficulty' }) as any}");
content = content.replace(/value=\{<StatusBadge config=\{difficultyConfig\[question.difficulty\]\} \/>\}/, "value={question.difficulty}");
content = content.replace(/label=\{t\('questionBank.fields.category'\)\}/, "label={t('questionBank.fields.category', { defaultValue: 'Category' }) as any}");

// replace the category mapping part
content = content.replace(
  /<CategoryColorChip\s+key=\{catId\}\s+category=\{cat\}\s+\/>/g,
  "<CategoryColorChip key={catId} categoryId={catId} name={cat?.name || catId} />"
);

content = content.replace(/label=\{t\('questionBank.fields.marks'\)\}/, "label={t('questionBank.fields.marks', { defaultValue: 'Marks' }) as any}");
content = content.replace(/value=\{question.defaultMarks\}/, "value={question.marks || 1}");

content = content.replace(/<DetailSectionTitle>\{t\('questionBank.fields.content'\)\}<\/DetailSectionTitle>/, "<DetailSectionTitle>{t('questionBank.fields.content', { defaultValue: 'Content' }) as any}</DetailSectionTitle>");
content = content.replace(/<p className="whitespace-pre-wrap text-sm text-foreground m-0">\{question.content\}<\/p>/, '<p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.text}</p>');

content = content.replace(/<DetailSectionTitle>\{t\('questionBank.fields.explanation'\)\}<\/DetailSectionTitle>/, "<DetailSectionTitle>{t('questionBank.fields.explanation', { defaultValue: 'Explanation' }) as any}</DetailSectionTitle>");
content = content.replace(/<p className="whitespace-pre-wrap text-sm text-foreground m-0">\{question.explanation\}<\/p>/, '<p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.answer}</p>');

// Also update DetailSectionTitle for overview:
content = content.replace(/<DetailSectionTitle>\{t\('questionBank.detail.overview'\)\}<\/DetailSectionTitle>/, "<DetailSectionTitle>{t('questionBank.detail.overview', { defaultValue: 'Overview' }) as any}</DetailSectionTitle>");

fs.writeFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', content);
