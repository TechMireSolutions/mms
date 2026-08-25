import fs from 'fs';

let qb = fs.readFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', 'utf8');

qb = qb.replace(/title=\{t\('questionBank\.detail\.title'.*?\}\s+subtitle=\{question\.type\}\s+icon=\{FileQuestion\}\s+headerExtra=\{isArchived.*?\}\s+headerActions=\{/, 
`title={t('questionBank.detail.title', { defaultValue: 'Question Details' }) as any}
      subtitle={question.type}
      icon={FileQuestion}
      headerExtra={isArchived && <DetailDrawerArchivedBanner deletedAt={question.deletedAt} />}
      headerActions={`);

qb = qb.replace(/<DetailDrawerRestoreOrEditAction[\s\S]*?\/>/, 
`<DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canEdit={!!onEdit}
          canRestore={canDelete}
          onEdit={() => onEdit?.(question)}
          onRestore={() => onRestore?.(question.id)}
          restoreLabel={t('common.restore', { defaultValue: 'Restore' }) as any}
          editLabel={t('common.edit', { defaultValue: 'Edit' }) as any}
        />`);

qb = qb.replace(/<DetailSectionTitle>.*?<\/DetailSectionTitle>\s*<Card className="overflow-hidden">\s*<div className="divide-y divide-border">[\s\S]*?<\/div>\s*<\/Card>/, 
`<DetailSectionTitle>{t('questionBank.detail.overview', { defaultValue: 'Overview' }) as any}</DetailSectionTitle>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <DetailAttributeRow 
                label={t('questionBank.fields.type', { defaultValue: 'Type' }) as any} 
                value={typeConfigItem?.label || question.type} 
              />
              <DetailAttributeRow 
                label={t('questionBank.fields.difficulty', { defaultValue: 'Difficulty' }) as any} 
                value={diffConfigItem?.label || question.difficulty} 
              />
              <DetailAttributeRow 
                label={t('questionBank.fields.category', { defaultValue: 'Category' }) as any} 
                value={
                  <div className="flex flex-wrap gap-1">
                    {question.categoryIds?.map(catId => (
                      <CategoryColorChip key={catId} categoryId={catId} name={catId} />
                    ))}
                  </div>
                } 
              />
              <DetailAttributeRow 
                label={t('questionBank.fields.marks', { defaultValue: 'Marks' }) as any} 
                value={question.marks ?? 1} 
              />
            </div>
          </Card>`);

qb = qb.replace(/<DetailSectionTitle>.*?<\/DetailSectionTitle>\s*<Card className="p-4">\s*<p className="whitespace-pre-wrap text-sm text-foreground m-0">.*?<\/p>\s*<\/Card>/, 
`<DetailSectionTitle>{t('questionBank.fields.content', { defaultValue: 'Content' }) as any}</DetailSectionTitle>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.text}</p>
            </Card>`);

qb = qb.replace(/\{question\.explanation && \([\s\S]*?<\/section>\s*\)}/, 
`{question.answer && (
          <section>
            <DetailSectionTitle>{t('questionBank.fields.explanation', { defaultValue: 'Explanation' }) as any}</DetailSectionTitle>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground m-0">{question.answer}</p>
            </Card>
          </section>
        )}`);

fs.writeFileSync('apps/frontend/src/tenant/features/question-bank/components/QuestionBankDetail.tsx', qb);

let exam = fs.readFileSync('apps/frontend/src/tenant/features/examinations/components/ExaminationDetail.tsx', 'utf8');

exam = exam.replace(/<DetailDrawerRestoreOrEditAction[\s\S]*?\/>/, 
`<DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canEdit={!!onEdit}
          canRestore={canDelete}
          onEdit={() => onEdit?.(exam)}
          onRestore={() => onRestore?.(exam.id)}
          restoreLabel={t('common.restore', { defaultValue: 'Restore' }) as any}
          editLabel={t('common.edit', { defaultValue: 'Edit' }) as any}
        />`);

exam = exam.replace(/<DetailSectionTitle>.*?<\/DetailSectionTitle>\s*<Card className="overflow-hidden">\s*<div className="divide-y divide-border">[\s\S]*?<\/div>\s*<\/Card>/, 
`<DetailSectionTitle>{t('examinations.detail.overview', { defaultValue: 'Overview' }) as any}</DetailSectionTitle>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <DetailAttributeRow 
                label={t('examinations.fields.status', { defaultValue: 'Status' }) as any} 
                value={statusItem ? <StatusBadge config={statusItem} /> : '—'} 
              />
              <DetailAttributeRow 
                label={t('examinations.fields.date', { defaultValue: 'Date' }) as any} 
                value={exam.date ? formatDate(exam.date) : '—'} 
              />
              <DetailAttributeRow 
                label={t('examinations.fields.classTargets', { defaultValue: 'Classes' }) as any} 
                value={exam.classIds?.length > 0 ? exam.classIds.join(', ') : '—'} 
              />
            </div>
          </Card>`);
          
fs.writeFileSync('apps/frontend/src/tenant/features/examinations/components/ExaminationDetail.tsx', exam);
