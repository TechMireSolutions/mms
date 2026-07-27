import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { DASHBOARD_MODULE_MANIFEST } from '@mms/shared';
import StatsGrid from '@/tenant/features/dashboard/components/StatisticsGrid';
import DashboardRolePanel from '@/tenant/features/dashboard/components/DashboardRolePanel';
import DashboardCustomizePanel from '@/tenant/features/dashboard/components/DashboardCustomizePanel';
import WelcomeBanner from '@/tenant/features/dashboard/components/WelcomeBanner';
import { resolveDashboardRole, widgetMatchesDashboardRole } from '@/lib/dashboardRole';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import {
  DashboardWidgets,
  CustomWidget,
} from '@/tenant/features/reports/components/PinnedWidgets';
import { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';
import { useDashboardMetricCards } from '@/tenant/features/dashboard/hooks/useDashboardMetricCards';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { buildDashboardNotifications } from '@/lib/buildDashboardNotifications';
import { isSeededDashboardWidget } from '@/lib/dashboardWidgets';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { can } = usePermissions();
  const dashboardRole = useMemo(() => resolveDashboardRole(can), [can]);
  const globalSettings = useGlobalSettings();
  const enabledModules = useMemo(() => globalSettings.enabledModules || {}, [globalSettings.enabledModules]);

  const {
    disabledCardIds,
    customWidgets,
    updateCustomWidgets,
    toggleCardVisibility,
  } = useDashboardConfig();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isWidgetBuilderOpen, setIsWidgetBuilderOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
  const [widgetBuilderType, setWidgetBuilderType] = useState<CustomWidget['widgetType']>('card');

  const canCustomize = can(DASHBOARD_MODULE_MANIFEST.permissions.customize);

  const dashboardData = useDashboardData(customWidgets, dashboardRole);
  const {
    invoices,
    attendanceRecords,
    sessions,
    studentMetricsInactive,
    studentMetricsActive,
  } = dashboardData;

  const closeBuilder = useCallback(() => {
    setIsWidgetBuilderOpen(false);
    setEditingWidget(null);
  }, []);

  const openWidgetBuilder = useCallback(
    (type: CustomWidget['widgetType'], widget: CustomWidget | null = null) => {
      if (!canCustomize) return;
      if (!isEditMode) setIsEditMode(true);
      setEditingWidget(widget);
      setWidgetBuilderType(type);
      setIsWidgetBuilderOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [canCustomize, isEditMode],
  );

  const handleUnpinWidget = (widgetId: string) => {
    updateCustomWidgets(
      customWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, isPinnedToDashboard: false } : widget,
      ),
    );
  };

  const handleDeleteWidget = (widgetId: string) => {
    updateCustomWidgets(customWidgets.filter((widget) => widget.id !== widgetId));
  };

  const handleEditWidget = (widget: CustomWidget) => {
    openWidgetBuilder(widget.widgetType || 'kpi', widget);
  };

  const toggleWidgetPin = (widgetId: string) => {
    updateCustomWidgets(
      customWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, isPinnedToDashboard: !widget.isPinnedToDashboard } : widget,
      ),
    );
  };

  const handleSaveWidget = useCallback(
    (savedWidget: CustomWidget) => {
      const widgetAlreadyExists = customWidgets.some((widget) => widget.id === savedWidget.id);
      const nextWidgets = widgetAlreadyExists
        ? customWidgets.map((widget) => (widget.id === savedWidget.id ? savedWidget : widget))
        : [...customWidgets, savedWidget];
      updateCustomWidgets(nextWidgets);
      closeBuilder();
    },
    [closeBuilder, customWidgets, updateCustomWidgets],
  );

  const activeCustomCards = useMemo(
    () =>
      customWidgets.filter(
        (widget) =>
          widget.widgetType === 'card' &&
          widgetMatchesDashboardRole(widget.role, dashboardRole) &&
          !isSeededDashboardWidget(widget.id),
      ),
    [customWidgets, dashboardRole],
  );

  const dashboardMetricCards = useDashboardMetricCards({
    customWidgets,
    dashboardRole,
    enabledModules,
    data: dashboardData,
    t,
  });

  const selectedDashboardCardCount = useMemo(
    () =>
      dashboardMetricCards.filter((dashboardCard) => !disabledCardIds.includes(dashboardCard.id))
        .length,
    [dashboardMetricCards, disabledCardIds],
  );

  const visibleDashboardMetricCards = useMemo(
    () => dashboardMetricCards.filter((dashboardCard) => !disabledCardIds.includes(dashboardCard.id)),
    [dashboardMetricCards, disabledCardIds],
  );

  const pinnedDashboardWidgetCount = customWidgets.filter((widget) => widget.isPinnedToDashboard).length;

  const notifications = useMemo(
    () =>
      buildDashboardNotifications(
        dashboardRole,
        { invoices, attendanceRecords, inactiveStudents: studentMetricsInactive },
        t,
        formatCurrency,
        can,
      ),
    [dashboardRole, invoices, attendanceRecords, studentMetricsInactive, t, formatCurrency, can],
  );

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('dashboard.title')}`}
      seoDescription={t('dashboard.metaDescription')}
    >
      <WelcomeBanner
        dashboardRole={dashboardRole}
        sessions={sessions}
        activeStudentCount={studentMetricsActive}
      />

      {canCustomize && (
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 select-none">
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? 'default' : 'outline'}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl cursor-pointer shadow-none h-9.5 ${
              isEditMode
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 border-transparent hover:bg-primary/95'
                : 'surface-glass text-muted-foreground hover:text-foreground hover:bg-muted/30 border-border/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            {isEditMode ? t('dashboard.exitCustomization') : t('dashboard.customizeCards')}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {canCustomize && isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden mb-2"
          >
            <DashboardCustomizePanel
              can={can}
              customWidgets={customWidgets}
              disabledCardIds={disabledCardIds}
              toggleCardVisibility={toggleCardVisibility}
              dashboardMetricCards={dashboardMetricCards}
              selectedDashboardCardCount={selectedDashboardCardCount}
              pinnedDashboardWidgetCount={pinnedDashboardWidgetCount}
              isWidgetBuilderOpen={isWidgetBuilderOpen}
              editingWidget={editingWidget}
              widgetBuilderType={widgetBuilderType}
              onCloseBuilder={closeBuilder}
              onSaveWidget={handleSaveWidget}
              onEditWidget={handleEditWidget}
              onDeleteWidget={handleDeleteWidget}
              onToggleWidgetPin={toggleWidgetPin}
              onOpenWidgetBuilder={openWidgetBuilder}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`metric-cards-${dashboardRole}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ErrorBoundary>
            <StatsGrid
              statItems={visibleDashboardMetricCards}
              customCardIds={activeCustomCards.map((customCard) => customCard.id)}
              onDeleteCustomCard={handleDeleteWidget}
              onEditCustomCard={(customCardId) => {
                const widget = customWidgets.find((dashboardWidget) => dashboardWidget.id === customCardId);
                if (widget) openWidgetBuilder('card', widget);
              }}
              isEditMode={isEditMode}
              onAddCardClick={isEditMode ? () => openWidgetBuilder('card', null) : undefined}
            />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>

      <ErrorBoundary>
        <DashboardWidgets
          widgets={customWidgets.filter((widget) => widget.isPinnedToDashboard)}
          onUnpin={handleUnpinWidget}
          isEditMode={isEditMode}
          onEditWidget={handleEditWidget}
          onDeleteWidget={handleDeleteWidget}
        />
      </ErrorBoundary>

      <AnimatePresence mode="wait">
        <motion.div
          key={`body-${dashboardRole}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorBoundary>
            <DashboardRolePanel dashboardRole={dashboardRole} notifications={notifications} />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </ModulePageShell>
  );
}
