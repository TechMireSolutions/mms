import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import Modal from './Modal';
import FormProgressBar from './FormProgressBar';
import SubTabBar, { type SubTab } from './SubTabBar';
import { Button } from './button';
import { cn } from '@/lib/utils';

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
export default function FormModal<K extends string = string>({
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
  children,
}: FormModalProps<K>): React.JSX.Element {
  const errors = useMemo(() => {
    if (!error) return [];
    return (Array.isArray(error) ? error : [error]).filter(Boolean);
  }, [error]);

  const panelClassName = tall ? 'h-[88vh] max-h-[700px]' : undefined;
  const hasTabs = tabs && tabs.length > 1 && activeTab !== undefined && onTabChange;

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

  const body = (
    <div lang={lang} dir={dir}>
      <FormErrorBanner errors={errors} />
      {hasTabs ? (
        <>
          <SubTabBar
            tabs={tabs}
            value={activeTab}
            onChange={onTabChange}
            panelIdPrefix={tabPanelIdPrefix}
            className="mb-4"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={String(activeTab)}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.13 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </>
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
      panelClassName={panelClassName}
      footer={
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
      }
    >
      {body}
    </Modal>
  );
}
