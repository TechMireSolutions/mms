import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Save, Settings, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { FormProgressBar } from '@/components/ui/FormProgressBar';
import { SubTabBar, type SubTab } from '@/components/ui/SubTabBar';
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
  cancelLabel: string;
  saveLabel: string;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  saved?: boolean;
  savedLabel?: string;
  footerStart?: React.ReactNode;
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
  tall = false,
  progress,
  progressLabel,
  headerExtra,
  error,
  tabs,
  activeTab,
  onTabChange,
  tabPanelIdPrefix = 'form-modal-tab',
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

  const panelClassName = tall ? 'h-[88vh] max-h-[700px]' : undefined;
  const hasTabs = !builderMode && tabs && tabs.length > 1 && activeTab !== undefined && onTabChange;

  const effectiveSize = useMemo((): NonNullable<FormModalProps<K>['size']> => {
    const requested = size ?? 'lg';
    if (requested === 'xl') return 'xl';
    if (tall || hasTabs) return 'lg';
    return requested;
  }, [size, tall, hasTabs]);

  const resolvedHeaderExtra = useMemo(() => {
    if (progress === undefined) return headerExtra;
    const bar = <FormProgressBar value={progress} label={progressLabel} />;
    if (!headerExtra) return bar;
    return (
      <div className="space-y-3">
        {bar}
        {headerExtra}
      </div>
    );
  }, [headerExtra, progress, progressLabel]);

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

  const body = (
    <div lang={lang} dir={dir} className="h-full">
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
                    "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap md:w-full justify-start cursor-pointer",
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
          
          <div className="flex-1 min-w-0 overflow-y-auto">
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
        builderMode ? null : (
          <div
            className={cn(
              'flex w-full items-center gap-2.5',
              footerStart ? 'justify-between' : 'justify-end',
            )}
          >
            {footerStart ? <div className="hidden min-w-0 sm:block">{footerStart}</div> : null}
            <div className="ml-auto flex items-center gap-2.5">
              <Button type="button" variant="outline" onClick={onClose}>
                {cancelLabel}
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
                    {savedLabel ?? saveLabel}
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {saveLabel}
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    {saveLabel}
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
