import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Pencil, Trash2, Plus } from 'lucide-react';
import type { Permission } from '@mms/shared';

import StatsGrid from '@/tenant/features/dashboard/components/StatsGrid';
import QuickActionsPanel from '@/tenant/features/dashboard/components/QuickActionsPanel';
import NotificationsPanel from '@/tenant/features/dashboard/components/NotificationsPanel';
import WelcomeBanner from '@/tenant/features/dashboard/components/WelcomeBanner';
import { resolveDashboardRole, widgetMatchesDashboardRole, type DashboardRole } from '@/lib/dashboardRole';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import {
  DashboardWidgets,
  CustomWidget,
  WidgetBuilder,
} from '@/tenant/features/reports/components/PinnedWidgets';
import { computeCustomCard as computeCustomCardShared, type ReportCollection } from '@/tenant/features/reports/components/reportMetadata';
import { computeContactsCustomCardValue, computeStudentsCustomCardValue, computeTeachersCustomCardValue } from '@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils';
import { useDashboardData } from '@/tenant/features/dashboard/hooks/useDashboardData';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardConfig } from '@/tenant/features/dashboard/hooks/useDashboardConfig';
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
  dashboardRole,
  notifications,
}: {
  dashboardRole: DashboardRole;
  notifications: ReturnType<typeof buildDashboardNotifications>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section>
            <QuickActionsPanel dashboardRole={dashboardRole} />
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

  const {
    studentsTotal,
    studentMetricsInactive,
    teachersTotal,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    denoms,
    contactsTotal,
    questions,
    tests,
    assessmentResults,

    studentMetricsNew,
    teacherMetricsNew,
    contactMetricsNew,
  } = useDashboardData(customWidgets, dashboardRole);

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

  const activeCustomCards = useMemo(
    () =>
      customWidgets.filter(
        (widget) =>
          widget.widgetType === 'card' &&
          widgetMatchesDashboardRole(widget.role, dashboardRole) &&
          !widget.id.startsWith('def-'),
      ),
    [customWidgets, dashboardRole],
  );

  const dashboardMetricCards = useMemo(() => {
    const isModuleEnabled = (moduleId: string) => enabledModules[moduleId] !== false;

    // 1. Dynamic Students Trend (Growth rate in last 30 days)
    const studentTrend = studentsTotal && studentMetricsNew
      ? Math.round((studentMetricsNew / Math.max(1, studentsTotal - studentMetricsNew)) * 100)
      : 0;

    // 2. Dynamic Teachers Trend
    const teacherTrend = teachersTotal && teacherMetricsNew
      ? Math.round((teacherMetricsNew / Math.max(1, teachersTotal - teacherMetricsNew)) * 100)
      : 0;

    // 3. Dynamic Contacts Trend
    const contactTrend = contactsTotal && contactMetricsNew
      ? Math.round((contactMetricsNew / Math.max(1, contactsTotal - contactMetricsNew)) * 100)
      : 0;

    // 4. Dynamic Attendance Today Trend (Latest vs Previous Day Rate Change)
    const getAttendanceRateForDate = (dateStr: string) => {
      const dayRecords = attendanceRecords.filter((r) => r.date === dateStr);
      if (dayRecords.length === 0) return null;
      const present = dayRecords.filter((r) => r.status === "present" || r.status === "late").length;
      return (present / dayRecords.length) * 100;
    };
    const sortedDates = [...new Set(attendanceRecords.map((r) => r.date as string))].sort();
    const latestDate = sortedDates[sortedDates.length - 1];
    const prevDate = sortedDates[sortedDates.length - 2];
    const latestRate = latestDate ? getAttendanceRateForDate(latestDate) : null;
    const prevRate = prevDate ? getAttendanceRateForDate(prevDate) : null;
    const attendanceTrend = (latestRate !== null && prevRate !== null && prevRate > 0)
      ? Math.round(latestRate - prevRate)
      : 0;

    // 5. Dynamic Fees (Revenue) Trend (Current month collections vs Last month)
    const getCollectedAmountForMonth = (year: number, month: number) => {
      let sum = 0;
      invoices.forEach((inv) => {
        if (!inv || inv.status === "cancelled") return;
        const dateStr = inv.paidDate || inv.dueDate || "";
        const date = new Date(dateStr);
        if (date.getFullYear() === year && date.getMonth() === month) {
          if (inv.status === "paid") {
            sum += inv.finalAmt;
          } else if (inv.status === "partial") {
            sum += inv.paidAmt || 0;
          }
        }
      });
      return sum;
    };
    const now = new Date();
    const currentMonthCollected = getCollectedAmountForMonth(now.getFullYear(), now.getMonth());
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthCollected = getCollectedAmountForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
    const feesTrend = prevMonthCollected > 0
      ? Math.round(((currentMonthCollected - prevMonthCollected) / prevMonthCollected) * 100)
      : (currentMonthCollected > 0 ? 100 : 0);

    // 6. Dynamic Outstanding Payments Trend
    const getOutstandingAmountForMonth = (year: number, month: number) => {
      let sum = 0;
      invoices.forEach((inv) => {
        if (!inv || inv.status === "cancelled" || inv.status === "paid") return;
        const dateStr = inv.dueDate || "";
        const date = new Date(dateStr);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const outstanding = inv.status === "partial" ? (inv.finalAmt - (inv.paidAmt || 0)) : inv.finalAmt;
          sum += outstanding;
        }
      });
      return sum;
    };
    const currentOutstanding = getOutstandingAmountForMonth(now.getFullYear(), now.getMonth());
    const prevOutstanding = getOutstandingAmountForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
    const outstandingTrend = prevOutstanding > 0
      ? Math.round(((currentOutstanding - prevOutstanding) / prevOutstanding) * 100)
      : (currentOutstanding > 0 ? 100 : 0);

    // 7. Dynamic Hasanat Awarded Trend (This week vs Last week points issued)
    const pointsMap = new Map<string, number>();
    (denoms || []).forEach((d) => pointsMap.set(d.id, d.points));
    const getHasanatPointsInPeriod = (daysStart: number, daysEnd: number) => {
      let sum = 0;
      const nowVal = new Date();
      const startTime = new Date(nowVal.getTime() - daysStart * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const endTime = new Date(nowVal.getTime() - daysEnd * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      hasanatDistributions.forEach((d) => {
        if (!d.issuedDate) return;
        if (d.issuedDate >= endTime && d.issuedDate <= startTime) {
          const points = pointsMap.get(d.denominationId) || 50;
          sum += (d.quantity || 1) * points;
        }
      });
      return sum;
    };
    const pointsThisWeek = getHasanatPointsInPeriod(0, 7);
    const pointsLastWeek = getHasanatPointsInPeriod(7, 14);
    const hasanatTrend = pointsLastWeek > 0
      ? Math.round(((pointsThisWeek - pointsLastWeek) / pointsLastWeek) * 100)
      : (pointsThisWeek > 0 ? 100 : 0);

    // 8. Dynamic Active Sessions Trend (This week vs Last week counts)
    const getSessionsInPeriod = (daysStart: number, daysEnd: number) => {
      const nowVal = new Date();
      const startTime = new Date(nowVal.getTime() - daysStart * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const endTime = new Date(nowVal.getTime() - daysEnd * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return sessions.filter((s) => {
        if (!s.startDate) return false;
        return s.startDate >= endTime && s.startDate <= startTime;
      }).length;
    };
    const sessionsThisWeek = getSessionsInPeriod(0, 7);
    const sessionsLastWeek = getSessionsInPeriod(7, 14);
    const sessionsTrend = sessionsLastWeek > 0
      ? Math.round(((sessionsThisWeek - sessionsLastWeek) / sessionsLastWeek) * 100)
      : (sessionsThisWeek > 0 ? 100 : 0);

    const dashboardCardWidgets = customWidgets.filter(
      (widget) => widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole),
    );

    const enabledDashboardCardWidgets = dashboardCardWidgets.filter((widget) => {
      const widgetCollection = widget.collection;
      const widgetId = widget.id;
      if (widgetCollection === 'sessions') return isModuleEnabled('sessions');
      if (widgetCollection === 'attendance_records') return isModuleEnabled('attendance');
      if (widgetCollection === 'hasanat_distributions') return isModuleEnabled('hasanat');
      if (widgetCollection === 'finance_invoices') {
        if (widgetId.includes('revenue') || widgetId.includes('expenses') || widget.category === 'accounting') {
          return isModuleEnabled('accounting');
        }
        return isModuleEnabled('finance');
      }
      return true;
    });

    return enabledDashboardCardWidgets.map((widget) => {
      if (widget.collection === 'contacts') {
        const aggregateValue = computeContactsCustomCardValue({
          id: widget.id,
          operation: widget.operation || 'count',
          targetField: widget.targetField,
          filterField: widget.filterField,
          filterOperator: widget.filterOperator,
          filterValue: widget.filterValue,
        });
        if (aggregateValue) {
          return {
            id: widget.id,
            title: resolveWidgetTitle(widget, t),
            value: String(aggregateValue.finalValue),
            sub: widget.fixedSubText || `${contactsTotal} total`,
            icon: widget.icon || 'Users',
            color: widget.color || 'blue',
            trend: contactTrend,
          };
        }
      }

      if (widget.collection === 'students') {
        const aggregateValue = computeStudentsCustomCardValue({
          id: widget.id,
          operation: widget.operation || 'count',
          targetField: widget.targetField,
          filterField: widget.filterField,
          filterOperator: widget.filterOperator,
          filterValue: widget.filterValue,
        });
        if (aggregateValue) {
          return {
            id: widget.id,
            title: resolveWidgetTitle(widget, t),
            value: String(aggregateValue.finalValue),
            sub: widget.fixedSubText || `${studentsTotal} total`,
            icon: widget.icon || 'GraduationCap',
            color: widget.color || 'emerald',
            trend: studentTrend,
          };
        }
      }

      if (widget.collection === 'teachers') {
        const aggregateValue = computeTeachersCustomCardValue({
          id: widget.id,
          operation: widget.operation || 'count',
          targetField: widget.targetField,
          filterField: widget.filterField,
          filterOperator: widget.filterOperator,
          filterValue: widget.filterValue,
        });
        if (aggregateValue) {
          return {
            id: widget.id,
            title: resolveWidgetTitle(widget, t),
            value: String(aggregateValue.finalValue),
            sub: widget.fixedSubText || `${teachersTotal} total`,
            icon: widget.icon || 'School',
            color: widget.color || 'blue',
            trend: teacherTrend,
          };
        }
      }

      const computedCard = computeCustomCardShared(
        {
          id: widget.id,
          role: widget.role,
          title: resolveWidgetTitle(widget, t),
          collection: widget.collection,
          operation: widget.operation || 'count',
          targetField: widget.targetField,
          filterField: widget.filterField,
          filterOperator: widget.filterOperator,
          filterValue: widget.filterValue,
          icon: widget.icon || 'GraduationCap',
          color: widget.color || 'emerald',
          subTextType: widget.subTextType || 'dynamic',
          fixedSubText: widget.fixedSubText,
          trend: widget.trend,
          trendType: widget.trendType,
        },
        {
          students: [],
          teachers: [],
          sessions,
          finance_invoices: invoices,
          attendance_records: attendanceRecords,
          hasanat_distributions: hasanatDistributions,
          hasanat_denoms: denoms,
          contacts: [],
          questions,
          tests,
          assessment_results: assessmentResults,
        },
      );

      // Resolve dynamic trend for standard cards based on category/id keywords
      let resolvedTrend = computedCard.trend || 0;
      const widgetIdLower = widget.id.toLowerCase();
      if (widgetIdLower.includes('attendance') || widgetIdLower.includes('rate')) {
        resolvedTrend = attendanceTrend;
      } else if (widgetIdLower.includes('fees') || widgetIdLower.includes('revenue') || widgetIdLower.includes('income')) {
        resolvedTrend = feesTrend;
      } else if (widgetIdLower.includes('outstanding') || widgetIdLower.includes('debt') || widgetIdLower.includes('overdue')) {
        resolvedTrend = outstandingTrend;
      } else if (widgetIdLower.includes('hasanat') || widgetIdLower.includes('points')) {
        resolvedTrend = hasanatTrend;
      } else if (widgetIdLower.includes('sessions') || widgetIdLower.includes('classes')) {
        resolvedTrend = sessionsTrend;
      }

      return {
        id: computedCard.id,
        title: resolveWidgetTitle(widget, t),
        value: computedCard.value,
        sub: computedCard.sub,
        icon: computedCard.icon,
        color: computedCard.color,
        trend: resolvedTrend,
      };
    });
  }, [
    dashboardRole,
    enabledModules,
    customWidgets,
    studentsTotal,
    studentMetricsNew,
    teachersTotal,
    teacherMetricsNew,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    denoms,
    contactsTotal,
    contactMetricsNew,
    questions,
    tests,
    assessmentResults,
    t,
  ]);

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
      ),
    [dashboardRole, invoices, attendanceRecords, studentMetricsInactive, t],
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <title>MMS - {t('dashboard.title')}</title>
      <meta name="description" content={t('dashboard.metaDescription')} />

      <WelcomeBanner dashboardRole={dashboardRole} />

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
                        const widgetAlreadyExists = customWidgets.some((widget) => widget.id === savedWidget.id);
                        const nextWidgets = widgetAlreadyExists
                          ? customWidgets.map((widget) => (widget.id === savedWidget.id ? savedWidget : widget))
                          : [...customWidgets, savedWidget];
                        updateCustomWidgets(nextWidgets);
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
                        {t('dashboard.selectedCards', { count: selectedDashboardCardCount })}
                      </p>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {dashboardMetricCards.map((dashboardCard) => {
                        const isChecked = !disabledCardIds.includes(dashboardCard.id);
                        return (
                          <label
                            key={dashboardCard.id}
                            className="flex items-start gap-3 p-2.5 rounded-xl border border-border/40 bg-card/20 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCardVisibility(dashboardCard.id)}
                              className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <p className="text-xs font-semibold text-foreground leading-tight">{dashboardCard.title}</p>
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
                        {t('dashboard.pinnedCharts', { count: pinnedDashboardWidgetCount })}
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
    </div>
  );
}
