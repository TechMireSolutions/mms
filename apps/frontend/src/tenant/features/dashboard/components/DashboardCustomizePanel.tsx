import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  type Permission,
  STUDENTS_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
} from '@mms/shared';
import {
  WidgetBuilder,
} from '@/lib/reports/pinnedWidgets';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  METADATA_FIELDS,
  getCollectionLabel,
  type ReportCollection,
} from '@/lib/reports/reportMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { isSeededDashboardWidget, resolveWidgetTitle } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { StatItem } from '@/tenant/features/dashboard/components/StatisticsGrid';

function defaultWidgetScope(can: (permission: Permission) => boolean): {
  collection: ReportCollection;
  category: string;
} {
  if (can(STUDENTS_MODULE_MANIFEST.permissions.write) || can(USERS_MODULE_MANIFEST.permissions.write)) {
    return { collection: 'students', category: 'students' };
  }
  if (can(ATTENDANCE_MODULE_MANIFEST.permissions.write)) {
    return { collection: 'sessions', category: 'sessions' };
  }
  return { collection: 'finance_invoices', category: 'financial' };
}

export interface DashboardCustomizePanelProps {
  can: (permission: Permission) => boolean;
  customWidgets: CustomWidget[];
  disabledCardIds: string[];
  toggleCardVisibility: (cardId: string) => void;
  dashboardMetricCards: StatItem[];
  selectedDashboardCardCount: number;
  pinnedDashboardWidgetCount: number;
  isWidgetBuilderOpen: boolean;
  editingWidget: CustomWidget | null;
  widgetBuilderType: CustomWidget['widgetType'];
  onCloseBuilder: () => void;
  onSaveWidget: (widget: CustomWidget) => void;
  onEditWidget: (widget: CustomWidget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onToggleWidgetPin: (widgetId: string) => void;
  onOpenWidgetBuilder: (type: CustomWidget['widgetType'], widget?: CustomWidget | null) => void;
}

/**
 * Dashboard customize mode: metric card visibility + pinned widget management.
 */
export default function DashboardCustomizePanel({
  can,
  customWidgets,
  disabledCardIds,
  toggleCardVisibility,
  dashboardMetricCards,
  selectedDashboardCardCount,
  pinnedDashboardWidgetCount,
  isWidgetBuilderOpen,
  editingWidget,
  widgetBuilderType,
  onCloseBuilder,
  onSaveWidget,
  onEditWidget,
  onDeleteWidget,
  onToggleWidgetPin,
  onOpenWidgetBuilder,
}: DashboardCustomizePanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const widgetScope = defaultWidgetScope(can);

  return (
    <div className="space-y-5 pb-1">
      <AnimatePresence>
        {isWidgetBuilderOpen && (
          <div className="mb-5">
            <WidgetBuilder
              initialCollection={widgetScope.collection}
              editWidgetConfig={editingWidget}
              onCancelEdit={onCloseBuilder}
              onSaveWidget={onSaveWidget}
              category={widgetScope.category}
              mode="dashboard"
              initialWidgetType={widgetBuilderType}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-start">
        <div className="rounded-2xl border border-border/60 bg-card/65 dark:bg-card/40 backdrop-blur-2xl p-6 shadow-xl">
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-xs font-black text-primary uppercase tracking-widest leading-none mb-1">
              {t('dashboard.metricCardsSettings')}
            </legend>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('dashboard.metricCardsSettingsDesc')}</p>

            <div className="text-xs border-b border-border/45 pb-3">
              <p className="font-bold text-foreground">
                {t('dashboard.selectedCards', { count: selectedDashboardCardCount })}
              </p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pe-1">
              {dashboardMetricCards.map((dashboardCard) => {
                const isChecked = !disabledCardIds.includes(dashboardCard.id);
                return (
                  <div
                    key={dashboardCard.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all select-none cursor-pointer"
                    onClick={() => toggleCardVisibility(dashboardCard.id)}
                  >
                    <Checkbox
                      id={`card-vis-${dashboardCard.id}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleCardVisibility(dashboardCard.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                    <label
                      htmlFor={`card-vis-${dashboardCard.id}`}
                      className="text-xs font-bold text-foreground leading-tight cursor-pointer select-none"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {dashboardCard.title}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/65 dark:bg-card/40 backdrop-blur-2xl p-6 shadow-xl">
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-xs font-black text-primary uppercase tracking-widest leading-none mb-1">
              {t('dashboard.chartsWidgetsSettings')}
            </legend>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('dashboard.chartsWidgetsSettingsDesc')}</p>

            <div className="text-xs border-b border-border/45 pb-3 space-y-0.5">
              <p className="font-bold text-foreground">
                {t('dashboard.pinnedCharts', { count: pinnedDashboardWidgetCount })}
              </p>
              <p className="text-xs text-muted-foreground/80 font-semibold">
                {t('dashboard.totalWidgets', { count: customWidgets.length })}
              </p>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pe-1">
              {customWidgets.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">{t('dashboard.noWidgets')}</p>
              ) : (
                customWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all select-none cursor-pointer"
                    onClick={() => onToggleWidgetPin(widget.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        id={`widget-pin-${widget.id}`}
                        checked={widget.isPinnedToDashboard}
                        onCheckedChange={() => onToggleWidgetPin(widget.id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <label
                        htmlFor={`widget-pin-${widget.id}`}
                        className="space-y-0.5 cursor-pointer flex-1 select-none text-start truncate"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <p className="text-xs font-bold text-foreground leading-tight truncate">
                          {resolveWidgetTitle(widget, t)}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider capitalize truncate">
                          {getCollectionLabel(
                            widget.collection,
                            METADATA_FIELDS[widget.collection]?.name || widget.collection,
                            t,
                          )}
                        </p>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(event) => event.stopPropagation()}>
                      <Button
                        onClick={() => onEditWidget(widget)}
                        variant="ghost"
                        size="icon"
                        className="border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shadow-none cursor-pointer rounded-lg"
                        title={t('dashboard.editWidget')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {!isSeededDashboardWidget(widget.id) && (
                        <Button
                          onClick={() => onDeleteWidget(widget.id)}
                          variant="ghost"
                          size="icon"
                          className="border border-border/60 hover:border-destructive/30 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shadow-none cursor-pointer rounded-lg"
                          title={t('dashboard.deleteWidget')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => onOpenWidgetBuilder('kpi', null)}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-all bg-card/10 hover:bg-primary/5 shadow-none h-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.createWidget')}
            </Button>
          </fieldset>
        </div>
      </div>
    </div>
  );
}
