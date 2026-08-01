import { useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getObject, saveObject } from '@/lib/db';
import {
  isRestWidgetCollection,
  persistWidgetRecordToggle,
} from '@/lib/reports/widgetRecordToggle';
import { useWidgetCollections } from '@/lib/reports/useReportCollections';
import type { ReportCollection } from '@/lib/reports/reportMetadata';
import type { CustomWidget } from '@/tenant/features/reports/components/pinnedWidgets/types';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { WidgetDrilldownModal } from '@/tenant/features/reports/components/pinnedWidgets/CustomWidgetRenderer';
import { useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
import { applyContactsWorkDrillDown } from '@/lib/contacts/contactsWorkDrillDown';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { DashboardWidgetsHeader } from '@/tenant/features/reports/components/pinnedWidgets/DashboardWidgetsHeader';
import { DashboardWidgetsGrid } from '@/tenant/features/reports/components/pinnedWidgets/DashboardWidgetsGrid';

interface DashboardWidgetsProps {
  widgets?: CustomWidget[];
  onUnpin?: (id: string) => void;
  isEditMode?: boolean;
  onEditWidget?: (widget: CustomWidget) => void;
  onDeleteWidget?: (id: string) => void;
}

/**
 * Pinned Custom Dashboard Widgets Section. Displays widgets with size controls.
 */
export function DashboardWidgets({
  widgets,
  onUnpin,
  isEditMode = false,
  onEditWidget,
  onDeleteWidget,
}: DashboardWidgetsProps = {}): React.JSX.Element | null {
  const { t } = useTranslation();
  const { gridMode, updatePref } = useDashboardConfig();
  const [localWidgets, setLocalWidgets] = useState<CustomWidget[]>([]);

  const [drilldownWidget, setDrilldownWidget] = useState<CustomWidget | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      if (widgets) return;
      try {
        const savedWidgets = getObject<CustomWidget[] | null>('kpi_custom_widgets', null);
        if (savedWidgets) {
          setLocalWidgets(savedWidgets.filter((widget) => widget.isPinnedToDashboard));
        }
      } catch (error) {
        console.error('Failed to load pinned widgets on dashboard', error);
        notify.error(t('reports.widgets.errorLoadFailed'));
      }
    };

    handleUpdate();
    window.addEventListener('local-database-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('local-database-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [widgets, t]);

  const activeWidgets = widgets ?? localWidgets;
  const requiredCollections = useMemo(() => {
    const required = new Set<ReportCollection>();
    for (const widget of activeWidgets) {
      required.add(widget.collection);
    }
    return required;
  }, [activeWidgets]);
  const collections = useWidgetCollections({
    enabled: activeWidgets.length > 0,
    requiredCollections,
  });

  useContactsWidgetAggregates(activeWidgets);
  useStudentsWidgetAggregates(activeWidgets);
  useTeachersWidgetAggregates(activeWidgets);

  const handleMetricClick = useCallback((widget: CustomWidget) => {
    if (widget.collection === 'contacts') {
      applyContactsWorkDrillDown({
        gender: widget.filterField === 'gender' && widget.filterValue ? widget.filterValue : undefined,
      });
      window.location.assign('/contacts');
      return;
    }
    setDrilldownWidget(widget);
  }, []);

  const handleLocalUnpin = (id: string) => {
    if (onUnpin) {
      onUnpin(id);
      return;
    }
    try {
      const savedWidgets = getObject<CustomWidget[] | null>('kpi_custom_widgets', null);
      if (savedWidgets) {
        const updatedWidgets = savedWidgets.map((widget) => {
          if (widget.id === id) {
            return { ...widget, isPinnedToDashboard: false };
          }
          return widget;
        });
        saveObject('kpi_custom_widgets', updatedWidgets);
        setLocalWidgets(updatedWidgets.filter((widget) => widget.isPinnedToDashboard));
        window.dispatchEvent(new Event('local-database-update'));
      }
    } catch (error) {
      console.error('Failed to unpin widget', error);
      notify.error(t('reports.widgets.errorUnpinFailed'));
    }
  };

  const handleToggleSwitchState = (widget: CustomWidget) => {
    if (widget.switchActionType === 'app_setting') {
      const switchStateKey = widget.switchStateKey || '';
      if (switchStateKey.startsWith('section_')) {
        const sectionKey = switchStateKey.replace('section_', '');
        const settings = getObject<Record<string, boolean>>('dashboard_section_settings', {});
        settings[sectionKey] = !settings[sectionKey];
        saveObject('dashboard_section_settings', settings);
      } else {
        const isEnabled =
          getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, 'false') === 'true';
        saveObject(switchStateKey, !isEnabled);
      }
      window.dispatchEvent(new Event('local-database-update'));
      return;
    }

    const collectionName = widget.switchCollection;
    const recordId = widget.switchRecordId;
    const targetField = widget.switchField || 'status';
    if (!collectionName || !recordId) return;
    if (!isRestWidgetCollection(collectionName)) {
      notify.error(t('reports.widgets.errorToggleFailed'));
      return;
    }
    void (async () => {
      try {
        await persistWidgetRecordToggle({
          collectionName,
          recordId: String(recordId),
          field: targetField,
        });
      } catch (error) {
        console.error(error);
        notify.error(t('reports.widgets.errorToggleFailed'));
      }
    })();
  };

  if (activeWidgets.length === 0) return null;

  return (
    <div className="space-y-4 text-start font-sans mt-5">
      <DashboardWidgetsHeader gridMode={gridMode} onToggleGridMode={(mode) => updatePref('gridMode', mode)} />

      <DashboardWidgetsGrid
        widgets={activeWidgets}
        gridMode={gridMode}
        collections={collections}
        isEditMode={isEditMode}
        onSwitchToggle={handleToggleSwitchState}
        onMetricClick={handleMetricClick}
        onUnpin={handleLocalUnpin}
        onEditWidget={onEditWidget}
        onDeleteWidget={onDeleteWidget}
      />

      <AnimatePresence>
        {drilldownWidget && (
          <WidgetDrilldownModal widget={drilldownWidget} onClose={() => setDrilldownWidget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
