import type React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL, WORK_SURFACE } from '@/components/ui/formStyles';
import { ErdMermaidDiagram } from '@/platform/components/erd/ErdMermaidDiagram';
import { ErdRelationshipList } from '@/platform/components/erd/ErdRelationshipList';
import { useErdPageController } from '@/platform/hooks/useErdPageController';

export function ErdExplorer(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    domainId,
    focusTable,
    visible,
    tableNames,
    domainOptions,
    isLive,
    setDomainId,
    setFocusTable,
  } = useErdPageController();

  const formattedDomainOptions = domainOptions.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));
  const tableOptions = [
    { value: '', label: t('platform.erdAllTables') },
    ...tableNames.map((name) => ({ value: name, label: name })),
  ];

  return (
    <div className="space-y-6">
      <div className={`${WORK_SURFACE} grid gap-4 p-4 sm:grid-cols-2`}>
        <label className="block min-w-0">
          <span className={FORM_LABEL}>{t('platform.erdDomainLabel')}</span>
          <FormSelect
            name="erd-domain"
            aria-label={t('platform.erdDomainLabel')}
            value={domainId}
            onChange={setDomainId}
            options={formattedDomainOptions}
          />
        </label>
        <label className="block min-w-0">
          <span className={FORM_LABEL}>{t('platform.erdFocusTable')}</span>
          <FormSelect
            name="erd-table"
            aria-label={t('platform.erdFocusTable')}
            value={focusTable}
            onChange={setFocusTable}
            options={tableOptions}
          />
        </label>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {t('platform.erdTableCount', { count: visible.tables.length })}
        </p>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live Schema
          </span>
        )}
      </div>

      <ErdMermaidDiagram key={`${domainId}:${focusTable}`} domain={visible} />

      <ErdRelationshipList relationships={visible.relationships} />
    </div>
  );
}
