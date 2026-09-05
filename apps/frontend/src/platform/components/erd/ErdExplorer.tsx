import type React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL, WORK_SURFACE } from '@/components/ui/formStyles';
import { ErdMermaidDiagram } from '@/platform/components/erd/ErdMermaidDiagram';
import { ErdRelationshipList } from '@/platform/components/erd/ErdRelationshipList';
import { ERD_DOMAIN_OPTIONS, useErdPageController } from '@/platform/hooks/useErdPageController';

export function ErdExplorer(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    domainId,
    focusTable,
    visible,
    tableNames,
    setDomainId,
    setFocusTable,
  } = useErdPageController();

  const domainOptions = ERD_DOMAIN_OPTIONS.map((option) => ({
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
            options={domainOptions}
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

      <p className="text-sm text-muted-foreground">
        {t('platform.erdTableCount', { count: visible.tables.length })}
      </p>

      <ErdMermaidDiagram key={`${domainId}:${focusTable}`} domain={visible} />

      <ErdRelationshipList relationships={visible.relationships} />
    </div>
  );
}
