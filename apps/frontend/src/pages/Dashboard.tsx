import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Pencil, Trash2, Plus } from 'lucide-react';
import type { Permission } from '@mms/shared';

import StatsGrid from '@/components/dashboard/StatsGrid';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import { resolveDashboardPersona, widgetMatchesPersona, type DashboardPersona } from '@/lib/dashboardPersona';
import usePermissions from '@/hooks/usePermissions';
import {
  DashboardWidgets,
  CustomWidget,
  WidgetBuilder,
  getOrInitializeCustomWidgets,
} from '@/components/reports/PinnedWidgets';
import { computeCustomCard as computeCustomCardShared, type ReportCollection } from '@/components/reports/reportMetadata';
import { useDashboardData } from '@/hooks/useDashboardData';
import useGlobalSettings from '@/hooks/useGlobalSettings';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import useTranslation from '@/hooks/useTranslation';
import {
  loadDisabledCardIds,
  saveDisabledCardIds,
  saveCustomWidgetsRaw,
  DASHBOARD_WIDGETS_KEY,
} from '@/lib/dashboardPreferences';
import { resolveWidgetTitle } from '@/lib/dashboardWidgets';
import { buildDashboardNotifications } from '@/lib/buildDashboardNotifications';

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

function DashboardRolePanel({
  persona,
  notifications,
}: {
  persona: DashboardPersona;
  notifications: ReturnType<typeof buildDashboardNotifications>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section>
            <QuickActionsPanel role={persona} />
          </Section>
        </div>
        <Section>
          <NotificationsPanel items={notifications} />
        </Section>
      </div>
    </div>
  );
}

function defaultWidgetCollection(can: (permission: Permission) => boolean): ReportCollection {
  if (can('students.write') || can('users.manage')) return 'students';
  if (can('attendance.write')) return 'sessions';
  return 'finance_invoices';
}

function defaultWidgetCategory(can: (permission: Permission) => boolean): string {
  if (can('students.write') || can('users.manage')) return 'students';
  if (can('attendance.write')) return 'sessions';
  return 'financial';
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const dashboardPersona = useMemo(() => resolveDashboardPersona(can), [can]);
  const globalSettings = useGlobalSettings();
  const enabledModules = globalSettings.enabledModules || {};

  const [isEditMode, setIsEditMode] = useState(false);
  const [disabledCardIds, setDisabledCardIds] = useState<string[]>(() => loadDisabledCardIds());
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>(() => getOrInitializeCustomWidgets());
  const [isWidgetBuilderOpen, setIsWidgetBuilderOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
  const [widgetBuilderType, setWidgetBuilderType] = useState<CustomWidget['widgetType']>('card');

  const {
    students,
    teachers,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    contacts,
    questions,
    tests,
    assessmentResults,
    dataVolume,
  } = useDashboardData(customWidgets, dashboardPersona);

  useEffect(() => {
    const handleUpdate = () => {
      setDisabledCardIds(loadDisabledCardIds());
      try {
        const savedWidgets = localStorage.getItem(DASHBOARD_WIDGETS_KEY);
        if (savedWidgets) {
          setCustomWidgets(JSON.parse(savedWidgets) as CustomWidget[]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('local-database-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('local-database-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const openWidgetBuilder = useCallback(
    (type: CustomWidget['widgetType'], widget: CustomWidget | null = null) => {
      if (!isEditMode) setIsEditMode(true);
      setEditingWidget(widget);
      setWidgetBuilderType(type);
      setIsWidgetBuilderOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [isEditMode],
  );

  const persistWidgets = (next: CustomWidget[]) => {
    setCustomWidgets(next);
    saveCustomWidgetsRaw(JSON.stringify(next));
    window.dispatchEvent(new Event('local-database-update'));
  };

  const handleUnpinWidget = (id: string) => {
    persistWidgets(
      customWidgets.map((w) => (w.id === id ? { ...w, isPinnedToDashboard: false } : w)),
    );
  };

  const handleDeleteWidget = (id: string) => {
    persistWidgets(customWidgets.filter((w) => w.id !== id));
  };

  const handleEditWidget = (w: CustomWidget) => {
    openWidgetBuilder(w.widgetType || 'kpi', w);
  };

  const toggleWidgetPin = (id: string) => {
    persistWidgets(
      customWidgets.map((w) =>
        w.id === id ? { ...w, isPinnedToDashboard: !w.isPinnedToDashboard } : w,
      ),
    );
  };

  const toggleCardVisibility = (cardId: string) => {
    const updated = disabledCardIds.includes(cardId)
      ? disabledCardIds.filter((id) => id !== cardId)
      : [...disabledCardIds, cardId];
    setDisabledCardIds(updated);
    saveDisabledCardIds(updated);
    window.dispatchEvent(new Event('local-database-update'));
  };

  const activeCustomCards = useMemo(
    () =>
      customWidgets.filter(
        (w) => w.widgetType === 'card' && widgetMatchesPersona(w.role, dashboardPersona) && !w.id.startsWith('def-'),
      ),
    [customWidgets, dashboardPersona],
  );

  const stats = useMemo(() => {
    const isEn = (id: string) => enabledModules[id] !== false;

    const cardWidgets = customWidgets.filter(
      (w) => w.widgetType === 'card' && widgetMatchesPersona(w.role, dashboardPersona),
    );

    const enabledCardWidgets = cardWidgets.filter((w) => {
      const coll = w.collection;
      const id = w.id;
      if (coll === 'sessions') return isEn('sessions');
      if (coll === 'attendance_records') return isEn('attendance');
      if (coll === 'hasanat_distributions') return isEn('hasanat');
      if (coll === 'finance_invoices') {
        if (id.includes('revenue') || id.includes('expenses') || w.category === 'accounting') {
          return isEn('accounting');
        }
        return isEn('finance');
      }
      return true;
    });

    return enabledCardWidgets.map((w) => {
      const result = computeCustomCardShared(
        {
          id: w.id,
          role: w.role,
          title: resolveWidgetTitle(w, t),
          collection: w.collection,
          operation: w.operation || 'count',
          targetField: w.targetField,
          filterField: w.filterField,
          filterOperator: w.filterOperator,
          filterValue: w.filterValue,
          icon: w.icon || 'GraduationCap',
          color: w.color || 'emerald',
          subTextType: w.subTextType || 'dynamic',
          fixedSubText: w.fixedSubText,
          trend: w.trend,
          trendType: w.trendType,
        },
        {
          students,
          teachers,
          sessions,
          finance_invoices: invoices,
          attendance_records: attendanceRecords,
          hasanat_distributions: hasanatDistributions,
          contacts,
          questions,
          tests,
          assessment_results: assessmentResults,
        },
      );

      return {
        id: result.id,
        title: resolveWidgetTitle(w, t),
        value: result.value,
        sub: result.sub,
        icon: result.icon,
        color: result.color,
        trend: result.trend || 0,
      };
    });
  }, [
    dashboardPersona,
    enabledModules,
    customWidgets,
    students,
    teachers,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    contacts,
    questions,
    tests,
    assessmentResults,
    t,
  ]);

  const selectedCount = useMemo(
    () => stats.filter((c) => !disabledCardIds.includes(c.id)).length,
    [stats, disabledCardIds],
  );

  const visibleStats = useMemo(
    () => stats.filter((s) => !disabledCardIds.includes(s.id)),
    [stats, disabledCardIds],
  );

  const pinnedCount = customWidgets.filter((w) => w.isPinnedToDashboard).length;

  const notifications = useMemo(
    () => buildDashboardNotifications(dashboardPersona, { invoices, attendanceRecords, students }, t),
    [dashboardPersona, invoices, attendanceRecords, students, t],
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <title>MMS - {t('dashboard.title')}</title>
      <meta name="description" content={t('dashboard.metaDescription')} />

      <WelcomeBanner persona={dashboardPersona} />

      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            isEditMode
              ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          type="button"
        >
          <Settings className="w-3.5 h-3.5" />
          {isEditMode ? t('dashboard.exitCustomization') : t('dashboard.customizeCards')}
        </button>
      </div>

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden mb-6"
          >
            <div className="space-y-6">
              <AnimatePresence>
                {isWidgetBuilderOpen && (
                  <div className="mb-6">
                    <WidgetBuilder
                      initialCollection={defaultWidgetCollection(can)}
                      editWidgetConfig={editingWidget}
                      onCancelEdit={() => {
                        setIsWidgetBuilderOpen(false);
                        setEditingWidget(null);
                      }}
                      onSaveWidget={(savedWidget) => {
                        const exists = customWidgets.some((w) => w.id === savedWidget.id);
                        const next = exists
                          ? customWidgets.map((w) => (w.id === savedWidget.id ? savedWidget : w))
                          : [...customWidgets, savedWidget];
                        persistWidgets(next);
                        setIsWidgetBuilderOpen(false);
                        setEditingWidget(null);
                      }}
                      category={defaultWidgetCategory(can)}
                      mode="dashboard"
                      initialWidgetType={widgetBuilderType}
                    />
                  </div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-6 shadow-xl">
                  <fieldset className="space-y-4 border-0 p-0 m-0">
                    <legend className="text-sm font-bold text-foreground uppercase tracking-widest">
                      {t('dashboard.metricCardsSettings')}
                    </legend>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.metricCardsSettingsDesc')}</p>

                    <div className="text-xs border-b border-border/50 pb-3">
                      <p className="font-semibold text-foreground">
                        {t('dashboard.selectedCards', { count: selectedCount })}
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {stats.map((card) => {
                        const isChecked = !disabledCardIds.includes(card.id);
                        return (
                          <label
                            key={card.id}
                            className="flex items-start gap-3 p-2.5 rounded-xl border border-border/40 bg-card/20 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCardVisibility(card.id)}
                              className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <p className="text-xs font-semibold text-foreground leading-tight">{card.title}</p>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-2xl p-6 shadow-xl">
                  <fieldset className="space-y-4 border-0 p-0 m-0">
                    <legend className="text-sm font-bold text-foreground uppercase tracking-widest">
                      {t('dashboard.chartsWidgetsSettings')}
                    </legend>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.chartsWidgetsSettingsDesc')}</p>

                    <div className="text-xs border-b border-border/50 pb-3 space-y-0.5">
                      <p className="font-semibold text-foreground">
                        {t('dashboard.pinnedCharts', { count: pinnedCount })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('dashboard.totalWidgets', { count: customWidgets.length })}
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {customWidgets.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-4 text-center">{t('dashboard.noWidgets')}</p>
                      ) : (
                        customWidgets.map((widget) => (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40 bg-card/20 hover:bg-muted/30 transition-colors"
                          >
                            <label className="flex items-start gap-3 cursor-pointer flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={widget.isPinnedToDashboard}
                                onChange={() => toggleWidgetPin(widget.id)}
                                className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                              />
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-foreground leading-tight">
                                  {resolveWidgetTitle(widget, t)}
                                </p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                  {widget.collection.replace('_', ' ')}
                                </p>
                              </div>
                            </label>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditWidget(widget)}
                                className="p-1 rounded border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                title={t('dashboard.editWidget')}
                                type="button"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {!widget.id.startsWith('def-') && (
                                <button
                                  onClick={() => handleDeleteWidget(widget.id)}
                                  className="p-1 rounded border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                  title={t('dashboard.deleteWidget')}
                                  type="button"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => openWidgetBuilder('kpi', null)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all bg-card/10 cursor-pointer"
                      type="button"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('dashboard.createWidget')}
                    </button>
                  </fieldset>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`stats-${dashboardPersona}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ErrorBoundary>
            <StatsGrid
              stats={visibleStats}
              customCardIds={activeCustomCards.map((c) => c.id)}
              onDeleteCustomCard={handleDeleteWidget}
              onEditCustomCard={(id) => {
                const widget = customWidgets.find((w) => w.id === id);
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
          widgets={customWidgets.filter((w) => w.isPinnedToDashboard)}
          onUnpin={handleUnpinWidget}
          isEditMode={isEditMode}
          onEditWidget={handleEditWidget}
          onDeleteWidget={handleDeleteWidget}
        />
      </ErrorBoundary>

      <AnimatePresence mode="wait">
        <motion.div
          key={`body-${dashboardPersona}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorBoundary>
            <DashboardRolePanel persona={dashboardPersona} notifications={notifications} />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
