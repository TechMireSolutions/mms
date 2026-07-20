import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Save, Settings, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { FormProgressBar } from '@/components/ui/FormProgressBar';
import type { SubTab } from '@/components/ui/SubTabBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

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
  children: React.ReactNode;
}

function FormErrorBanner({ errors }: { errors: readonly string[] }): React.JSX.Element | null {
  if (errors.length === 0) return null;
  return (
    <div className="mb-3 space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
      {errors.map((message) => (
        <p key={message} className="flex items-start gap-1.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {message}
        </p>
      ))}
    </div>
  );
}

interface DomProgressResult {
  progress: number | undefined;
  label: string | undefined;
  ref: React.RefObject<HTMLDivElement | null>;
}

/**
 * Tracks the filled progress of form inputs dynamically using the DOM.
 */
function useDomFormProgress(open: boolean, active: boolean): DomProgressResult {
  const [progress, setProgress] = React.useState<number | undefined>(undefined);
  const [label, setLabel] = React.useState<string | undefined>(undefined);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || !active) {
      setProgress(undefined);
      setLabel(undefined);
      return;
    }

    const updateProgress = () => {
      const container = ref.current;
      if (!container) return;

      const inputs = Array.from(
        container.querySelectorAll('input, select, textarea, [role="combobox"], [role="checkbox"]'),
      ) as HTMLElement[];

      if (inputs.length === 0) {
        setProgress(undefined);
        setLabel(undefined);
        return;
      }

      const targetInputs = inputs.filter((el) => {
        const type = el.getAttribute('type');
        if (type === 'submit' || type === 'button' || type === 'hidden') return false;
        return el.offsetParent !== null;
      });

      if (targetInputs.length === 0) {
        setProgress(undefined);
        setLabel(undefined);
        return;
      }

      const requiredInputs = targetInputs.filter(
        (el) =>
          (el as HTMLInputElement).required ||
          el.getAttribute('aria-required') === 'true' ||
          el.classList.contains('required'),
      );
      const sourceList = requiredInputs.length > 0 ? requiredInputs : targetInputs;

      const filledCount = sourceList.filter((el) => {
        if (el.tagName === 'INPUT') {
          const inputEl = el as HTMLInputElement;
          if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
            return inputEl.checked;
          }
          return inputEl.value.trim() !== '';
        }
        if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
          return (el as HTMLSelectElement | HTMLTextAreaElement).value.trim() !== '';
        }
        if (el.getAttribute('role') === 'checkbox') {
          return el.getAttribute('aria-checked') === 'true';
        }
        if (el.getAttribute('role') === 'combobox') {
          const text = el.textContent?.trim() || '';
          return text !== '' && !text.toLowerCase().includes('select');
        }
        return false;
      }).length;

      const percentage = Math.round((filledCount / sourceList.length) * 100);
      setProgress(percentage);
      setLabel(`${filledCount}/${sourceList.length}`);
    };

    const container = ref.current;
    if (!container) return;

    updateProgress();

    const observer = new MutationObserver(updateProgress);
    observer.observe(container, { childList: true, subtree: true, attributes: true });

    container.addEventListener('input', updateProgress);
    container.addEventListener('change', updateProgress);

    return () => {
      container.removeEventListener('input', updateProgress);
      container.removeEventListener('change', updateProgress);
      observer.disconnect();
    };
  }, [open, active]);

  return { progress, label, ref };
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
  children,
}: FormModalProps<K>): React.JSX.Element {
  const { t } = useTranslation();
  const errors = useMemo(() => {
    if (!error) return [];
    return (Array.isArray(error) ? error : [error]).filter(Boolean);
  }, [error]);

  const hasTabs = !builderMode && tabs && tabs.length > 1 && activeTab !== undefined && onTabChange;

  const { progress: domProgress, label: domLabel, ref: containerRef } = useDomFormProgress(
    open,
    !hasTabs && progress === undefined,
  );

  const panelClassName = cn(tall ? 'h-[88vh] max-h-[700px]' : undefined, panelClassNameProp);

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
        className="text-[11px] h-8 px-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider transition-all duration-300"
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

  // Auto-focus first interactive element when switching tabs
  const tabContentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open || !hasTabs || !activeTab) return;
    const timer = setTimeout(() => {
      if (!tabContentRef.current) return;
      const firstInput = tabContentRef.current.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"])',
      );
      if (firstInput && document.activeElement !== firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [open, hasTabs, activeTab]);

  const body = (
    <div ref={containerRef} lang={lang} dir={dir} className="h-full">
      <FormErrorBanner errors={errors} />
      {hasTabs ? (
        <TabsPrimitive.Root
          value={activeTab}
          onValueChange={(val) => onTabChange(val as K)}
          orientation="vertical"
          dir={dir}
          className="flex flex-col md:flex-row gap-6 h-full items-stretch"
        >
          <TabsPrimitive.List
            className="flex flex-row md:flex-col shrink-0 h-auto bg-muted/20 p-1 rounded-xl gap-1 border border-border overflow-x-auto md:overflow-x-visible md:border-e md:border-t-0 md:border-b-0 md:border-s-0 md:pe-4"
            style={{ minWidth: "180px" }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <TabsPrimitive.Trigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap md:w-full justify-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span>{tab.label}</span>
                </TabsPrimitive.Trigger>
              );
            })}
          </TabsPrimitive.List>
          
          <div ref={tabContentRef} className="flex-1 min-w-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={String(activeTab)}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.13 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </TabsPrimitive.Root>
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
      footer={
        hideFooter || builderMode ? null : (
          <div
            className={cn(
              'flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:items-center',
              footerStart ? 'justify-between' : 'justify-end',
            )}
          >
            {footerStart ? <div className="min-w-0 sm:flex-1">{footerStart}</div> : null}
            <div className="ml-auto flex items-center gap-2.5">
              <Button type="button" variant="outline" onClick={onClose}>
                {resolvedCancelLabel}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving || saveDisabled || saved}
                className="min-w-[120px]"
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
