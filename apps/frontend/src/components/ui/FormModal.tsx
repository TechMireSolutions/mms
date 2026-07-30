import React, { useMemo } from 'react';
import { CheckCircle2, Loader2, Save, Settings, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormModalTabs } from '@/components/ui/FormModalTabs';
import { FormProgressBar } from '@/components/ui/FormProgressBar';
import type { SubTab } from '@/components/ui/SubTabBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useDomFormProgress } from '@/components/ui/useDomFormProgress';

export type { SubTab as FormModalTab };

export interface FormModalProps<K extends string = string> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // default lg — omit on entity forms; xl only for wide grids
  panelClassName?: string;
  /** Fixed height for multi-tab forms (prevents chrome jump on tab switch). */
  tall?: boolean;
  /** 0–100 completion; renders a header progress bar when set. */
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
  onSave?: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  saved?: boolean;
  savedLabel?: string;
  footerStart?: React.ReactNode;
  hideFooter?: boolean;
  showBuilderToggle?: boolean;
  builderMode?: boolean;
  onBuilderModeChange?: (active: boolean) => void;
  /** Raise above other modals (nested dialogs). */
  priority?: boolean;
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
  children,
}: FormModalProps<K>): React.JSX.Element {
  const { t } = useTranslation();
  const errors = useMemo(() => {
    if (!error) return [];
    return (Array.isArray(error) ? error : [error]).filter(Boolean);
  }, [error]);

  const hasTabs =
    !builderMode && tabs !== undefined && tabs.length > 1 && activeTab !== undefined && onTabChange !== undefined;

  const { progress: domProgress, label: domLabel, ref: containerRef } = useDomFormProgress(
    open,
    !hasTabs && progress === undefined,
  );

  const panelClassName = cn(tall ? 'h-[88vh] max-h-[43.75rem]' : undefined, panelClassNameProp);

  const effectiveSize = useMemo((): NonNullable<FormModalProps<K>['size']> => {
    const requested = size ?? 'lg';
    if (requested === 'xl') return 'xl';
    if (tall || hasTabs) return 'lg';
    return requested;
  }, [size, tall, hasTabs]);

  const activeIndex = useMemo(() => {
    if (!tabs || !activeTab) return -1;
    return tabs.findIndex((tab) => tab.key === activeTab);
  }, [tabs, activeTab]);

  const computedProgress = useMemo(() => {
    if (progress !== undefined) return progress;
    if (hasTabs && activeIndex !== -1 && tabs) {
      return Math.round(((activeIndex + 1) / tabs.length) * 100);
    }
    return domProgress;
  }, [progress, hasTabs, activeIndex, tabs, domProgress]);

  const computedProgressLabel = useMemo(() => {
    if (progressLabel !== undefined) return progressLabel;
    if (hasTabs && activeIndex !== -1 && tabs) {
      return `${activeIndex + 1}/${tabs.length}`;
    }
    return domLabel;
  }, [progressLabel, hasTabs, activeIndex, tabs, domLabel]);

  const resolvedHeaderExtra = useMemo(() => {
    if (computedProgress === undefined) return headerExtra;
    const bar = <FormProgressBar value={computedProgress} label={computedProgressLabel} />;
    if (!headerExtra) return bar;
    return (
      <div className="space-y-3">
        {bar}
        {headerExtra}
      </div>
    );
  }, [headerExtra, computedProgress, computedProgressLabel]);

  const headerActions = useMemo(() => {
    if (!showBuilderToggle || !onBuilderModeChange) return null;
    return (
      <Button
        type="button"
        variant={builderMode ? 'default' : 'outline'}
        onClick={() => onBuilderModeChange(!builderMode)}
        className="text-xs min-h-11 px-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider transition-all duration-300"
      >
        {builderMode ? (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span>{t('contacts.form.viewForm')}</span>
          </>
        ) : (
          <>
            <Settings className="w-3.5 h-3.5" />
            <span>{t('contacts.form.editForm')}</span>
          </>
        )}
      </Button>
    );
  }, [showBuilderToggle, builderMode, onBuilderModeChange, t]);

  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const resolvedSaveLabel = saveLabel ?? t('common.save');

  // Cmd/Ctrl+Enter form submission shortcut
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
    <div ref={containerRef} lang={lang} dir={dir} className="h-full">
      <FormErrorBanner errors={errors} />
      {hasTabs ? (
        <FormModalTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} dir={dir}>
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
          <div
            className={cn(
              'flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center',
              footerStart ? 'justify-between' : 'justify-end',
            )}
          >
            {footerStart ? <div className="min-w-0 sm:flex-1">{footerStart}</div> : null}
            <div className="ms-auto flex items-center gap-2.5">
              <Button type="button" variant="outline" onClick={onClose}>
                {resolvedCancelLabel}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving || saveDisabled || saved}
                className="min-w-[7.5rem]"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {savedLabel ?? resolvedSaveLabel}
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {resolvedSaveLabel}
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    {resolvedSaveLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        )
      }
    >
      {body}
    </Modal>
  );
}
