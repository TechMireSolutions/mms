import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  WidgetBuilder,
} from '@/lib/reports/pinnedWidgets';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { useTranslation } from '@/hooks/useTranslation';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import type { StatItem } from '@/tenant/features/dashboard/components/StatisticsGrid';
import type { Permission } from '@mms/shared';
import { defaultWidgetScope } from '@/tenant/features/dashboard/components/dashboardCustomizePanelShared';
import { DashboardCustomizeWidgetsSection } from '@/tenant/features/dashboard/components/DashboardCustomizeWidgetsSection';

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
        <div className={`${WORK_SURFACE} p-6`}>
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <SectionLabel as="legend" tone="primary" className="leading-none mb-1">
              {t('dashboard.metricCardsSettings')}
            </SectionLabel>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('dashboard.metricCardsSettingsDesc')}</p>

            <div className="text-xs border-b border-border/45 pb-3">
              <p className="font-bold text-foreground">
                {t('dashboard.selectedCards', { count: selectedDashboardCardCount })}
              </p>
            </div>

            <div className="space-y-2 max-h-[18.75rem] overflow-y-auto pe-1">
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

        <DashboardCustomizeWidgetsSection
          customWidgets={customWidgets}
          pinnedDashboardWidgetCount={pinnedDashboardWidgetCount}
          onEditWidget={onEditWidget}
          onDeleteWidget={onDeleteWidget}
          onToggleWidgetPin={onToggleWidgetPin}
          onOpenWidgetBuilder={onOpenWidgetBuilder}
        />
      </div>
    </div>
  );
}
