import React from 'react';
import { Modal, type ModalProps } from '@/components/ui/Modal';
import { useFormModalLayout } from '@/components/ui/useFormModalLayout';
import type { SubTab } from '@/components/ui/SubTabBar';

export type { SubTab as FormModalTab };

export interface FormModalProps<K extends string = string> extends ModalProps<K> {
  tall?: boolean;
  tabPanelIdPrefix?: string;
  lang?: string;
  showBuilderToggle?: boolean;
  builderMode?: boolean;
  onBuilderModeChange?: (active: boolean) => void;
  saveOnTabChange?: boolean;
}

let warned = false;

/**
 * @deprecated FormModal is deprecated and consolidated into Modal.
 * Use `Modal` from `@/components/ui/Modal` directly.
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
  tabPanelIdPrefix: _tabPanelIdPrefix,
  lang: _lang,
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
}: FormModalProps<K>): React.JSX.Element | null {
  if (process.env.NODE_ENV !== 'production' && !warned) {
    warned = true;
    console.warn(
      '[MMS Deprecation] `FormModal` is deprecated. Use `Modal` from `@/components/ui/Modal` directly.',
    );
  }

  const handleTabChange = async (nextTab: K) => {
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
  };

  const {
    panelClassName,
    effectiveSize,
    resolvedHeaderExtra,
    headerActions,
  } = useFormModalLayout({
    open,
    size: size as 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl',
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
      error={error}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      dir={dir}
      cancelLabel={cancelLabel}
      saveLabel={saveLabel}
      onSave={onSave}
      saving={saving}
      saveDisabled={saveDisabled}
      saved={saved}
      savedLabel={savedLabel}
      footerStart={footerStart}
      hideFooter={hideFooter || builderMode}
    >
      {children}
    </Modal>
  );
}
