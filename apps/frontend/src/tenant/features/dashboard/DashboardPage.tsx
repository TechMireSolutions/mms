import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import StatsGrid from '@/tenant/features/dashboard/components/StatisticsGrid';
import DashboardRolePanel from '@/tenant/features/dashboard/components/DashboardRolePanel';
import DashboardCustomizePanel from '@/tenant/features/dashboard/components/DashboardCustomizePanel';
import WelcomeBanner from '@/tenant/features/dashboard/components/WelcomeBanner';
import { DashboardWidgets } from '@/lib/reports/pinnedWidgets';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { Button } from '@/components/ui/button';
import { useDashboardPageController } from '@/tenant/features/dashboard/hooks/useDashboardPageController';

export default function Dashboard() {
  const {
    t,
    can,
    dashboardRole,
    canCustomize,
    isEditMode,
    setIsEditMode,
    customWidgets,
    disabledCardIds,
    toggleCardVisibility,
    isWidgetBuilderOpen,
    editingWidget,
    widgetBuilderType,
    closeBuilder,
    handleSaveWidget,
    handleEditWidget,
    handleDeleteWidget,
    handleUnpinWidget,
    toggleWidgetPin,
    openWidgetBuilder,
    activeCustomCards,
    dashboardMetricCards,
    selectedDashboardCardCount,
    visibleDashboardMetricCards,
    pinnedDashboardWidgetCount,
    notifications,
    sessions,
    studentMetricsActive,
  } = useDashboardPageController();

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
            className={`flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-xl cursor-pointer shadow-none ${
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
