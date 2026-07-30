import React, { useMemo } from 'react';
import { Settings, Eye } from 'lucide-react';
import { FormProgressBar } from '@/components/ui/FormProgressBar';
import type { SubTab } from '@/components/ui/SubTabBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useDomFormProgress } from '@/components/ui/useDomFormProgress';

type FormModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface UseFormModalLayoutOptions<K extends string> {
  open: boolean;
  size: FormModalSize;
  tall: boolean;
  progress?: number;
  progressLabel?: React.ReactNode;
  headerExtra?: React.ReactNode;
  tabs?: readonly SubTab<K>[];
  activeTab?: K;
  builderMode: boolean;
  showBuilderToggle: boolean;
  onBuilderModeChange?: (active: boolean) => void;
  panelClassNameProp?: string;
}

export function useFormModalLayout<K extends string>({
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
}: UseFormModalLayoutOptions<K>) {
  const { t } = useTranslation();

  const hasTabs =
    !builderMode && tabs !== undefined && tabs.length > 1 && activeTab !== undefined;

  const { progress: domProgress, label: domLabel, ref: containerRef } = useDomFormProgress(
    open,
    !hasTabs && progress === undefined,
  );

  const panelClassName = cn(tall ? 'h-[88vh] max-h-[43.75rem]' : undefined, panelClassNameProp);

  const effectiveSize = useMemo((): FormModalSize => {
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

  return {
    hasTabs,
    containerRef,
    panelClassName,
    effectiveSize,
    resolvedHeaderExtra,
    headerActions,
  };
}
