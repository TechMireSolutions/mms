import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormModalTabs } from '@/components/ui/FormModalTabs';
import { FormModalFooter } from '@/components/ui/FormModalFooter';
import type { SubTab } from '@/components/ui/SubTabBar';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormModalLayout } from '@/components/ui/useFormModalLayout';

export type { SubTab as FormModalTab };

export interface FormModalProps<K extends string = string> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  panelClassName?: string;
  tall?: boolean;
  progress?: number;
  progressLabel?: React.ReactNode;
  headerExtra?: React.ReactNode;
  error?: string | readonly string[];
  tabs?: readonly SubTab<K>[];
  activeTab?: K;
  onTabChange?: (key: K) => void;
  tabPanelIdPrefix?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  cancelLabel?: string;
  saveLabel?: string;
  onSave?: (options?: { keepOpen?: boolean }) => void | Promise<unknown>;
  isDirty?: boolean;
  saving?: boolean;
  saveDisabled?: boolean;
  saved?: boolean;
  savedLabel?: string;
  footerStart?: React.ReactNode;
  hideFooter?: boolean;
  showBuilderToggle?: boolean;
  builderMode?: boolean;
  onBuilderModeChange?: (active: boolean) => void;
  priority?: boolean;
  /** Persist the current draft when switching tabs (default true). Disable for
   *  create flows where tab navigation should not create the record early. */
  saveOnTabChange?: boolean;
  children: React.ReactNode;
}

/**
 * Canonical add/edit entity dialog — `Modal` + optional `SubTabBar` + error banner + footer actions.
 */
export function FormModal<K extends string = string>({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  panelClassName: panelClassNameProp,
  tall = false,
  progress,
  progressLabel,
  headerExtra,
  error,
  tabs,
  activeTab,
  onTabChange,
  tabPanelIdPrefix: _tabPanelIdPrefix = 'form-modal-tab',
  lang,
  dir,
  cancelLabel,
  saveLabel,
  onSave,
  isDirty = false,
  saving = false,
  saveDisabled = false,
  saved = false,
  savedLabel,
  footerStart,
  hideFooter = false,
  showBuilderToggle = false,
  builderMode = false,
  onBuilderModeChange,
  priority = false,
  saveOnTabChange = true,
  children,
}: FormModalProps<K>): React.JSX.Element {
  const { t } = useTranslation();
  const errors = (() => {
    if (!error) return [];
    return (Array.isArray(error) ? error : [error]).filter(Boolean);
  })();

  const handleTabChange = (async (nextTab: K) => {
      if (nextTab === activeTab) return;
      if (saveOnTabChange && isDirty && onSave && !saveDisabled && !saving) {
        try {
          const result = await onSave({ keepOpen: true });
          if (result === false) return;
        } catch {
          return;
        }
      }
      onTabChange?.(nextTab);
    });

  const {
    hasTabs,
    containerRef,
    panelClassName,
    effectiveSize,
    resolvedHeaderExtra,
    headerActions,
  } = useFormModalLayout({
    open,
    size,
    tall,
    progress,
    progressLabel,
    headerExtra,
    tabs,
    activeTab,
    builderMode,
    showBuilderToggle,
    onBuilderModeChange,
    panelClassNameProp,
  });

  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const resolvedSaveLabel = saveLabel ?? t('common.save');

  React.useEffect(() => {
    if (!open || saving || saveDisabled || saved || !onSave) return;

    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [open, saving, saveDisabled, saved, onSave]);

  const body = (
    <div ref={containerRef} lang={lang} dir={dir} className="@container h-full" aria-busy={saving || undefined}>
      <FormErrorBanner errors={errors} />
      {hasTabs && activeTab !== undefined && onTabChange ? (
        <FormModalTabs tabs={tabs!} activeTab={activeTab} onTabChange={handleTabChange} dir={dir}>
          {children}
        </FormModalTabs>
      ) : (
        children
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={effectiveSize}
      headerExtra={resolvedHeaderExtra}
      headerActions={headerActions}
      panelClassName={panelClassName}
      priority={priority}
      footer={
        hideFooter || builderMode ? null : (
          <FormModalFooter
            footerStart={footerStart}
            cancelLabel={resolvedCancelLabel}
            saveLabel={resolvedSaveLabel}
            savedLabel={savedLabel}
            onClose={onClose}
            onSave={onSave ? () => { void onSave(); } : undefined}
            saving={saving}
            saveDisabled={saveDisabled}
            saved={saved}
          />
        )
      }
    >
      {body}
    </Modal>
  );
}
