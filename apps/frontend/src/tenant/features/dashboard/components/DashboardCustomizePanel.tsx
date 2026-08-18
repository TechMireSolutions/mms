import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { WidgetBuilder } from '@/lib/reports/pinnedWidgets';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { useTranslation } from '@/hooks/useTranslation';
import type { StatItem } from '@/lib/dashboardWidgets';
import type { Permission } from '@mms/shared';
import { resolveDefaultDashboardWidgetScope } from '@/lib/dashboardRole';
import { CustomizeItemRow } from '@/tenant/features/dashboard/components/CustomizeItemRow';
import { DashboardCustomizeWidgetsSection } from '@/tenant/features/dashboard/components/DashboardCustomizeWidgetsSection';
import { CustomizeSectionCard } from '@/tenant/features/dashboard/components/CustomizeSectionCard';

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
  const widgetScope = resolveDefaultDashboardWidgetScope(can);

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
        <CustomizeSectionCard
          title={t('dashboard.metricCardsSettings')}
          description={t('dashboard.metricCardsSettingsDesc')}
          headerContent={
            <p className="font-bold text-foreground">
              {t('dashboard.selectedCards', { count: selectedDashboardCardCount })}
            </p>
          }
        >
          {dashboardMetricCards.map((dashboardCard) => (
            <CustomizeItemRow
              key={dashboardCard.id}
              id={`card-vis-${dashboardCard.id}`}
              checked={!disabledCardIds.includes(dashboardCard.id)}
              onToggle={() => toggleCardVisibility(dashboardCard.id)}
              title={dashboardCard.title}
            />
          ))}
        </CustomizeSectionCard>

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
