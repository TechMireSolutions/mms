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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  lowAttendanceThreshold?: number;
  urgentAttendanceThreshold?: number;
  gridMode?: 'comfortable' | 'compact';
  onUpdateThreshold?: (key: 'lowAttendanceThreshold' | 'urgentAttendanceThreshold', value: number) => void;
  onUpdateGridMode?: (mode: 'comfortable' | 'compact') => void;
  onCloseBuilder: () => void;
  onSaveWidget: (widget: CustomWidget) => void;
  onEditWidget: (widget: CustomWidget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onToggleWidgetPin: (widgetId: string) => void;
  onOpenWidgetBuilder: (type: CustomWidget['widgetType'], widget?: CustomWidget | null) => void;
  onReorderWidgets?: (widgets: CustomWidget[]) => void;
}

/**
 * Dashboard customize mode: metric card visibility + pinned widget management + alert thresholds + layout density.
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
  lowAttendanceThreshold,
  urgentAttendanceThreshold,
  gridMode = 'comfortable',
  onUpdateThreshold,
  onUpdateGridMode,
  onCloseBuilder,
  onSaveWidget,
  onEditWidget,
  onDeleteWidget,
  onToggleWidgetPin,
  onOpenWidgetBuilder,
  onReorderWidgets,
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
          onReorderWidgets={onReorderWidgets}
        />

        {onUpdateGridMode && (
          <CustomizeSectionCard
            title={t('dashboard.layoutDensity')}
            description={t('dashboard.layoutDensityDesc')}
          >
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant={gridMode === 'comfortable' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdateGridMode('comfortable')}
                className="flex-1 cursor-pointer font-bold"
              >
                {t('dashboard.densityComfortable')}
              </Button>
              <Button
                type="button"
                variant={gridMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdateGridMode('compact')}
                className="flex-1 cursor-pointer font-bold"
              >
                {t('dashboard.densityCompact')}
              </Button>
            </div>
          </CustomizeSectionCard>
        )}

        {onUpdateThreshold && (
          <div className={onUpdateGridMode ? 'md:col-span-1' : 'md:col-span-2'}>
            <CustomizeSectionCard
              title={t('dashboard.alertSettings')}
              description={t('dashboard.alertSettingsDesc')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label htmlFor="pref-low-att" className="text-xs font-bold text-foreground">
                    {t('dashboard.lowAttendanceThresholdLabel')}
                  </label>
                  <Input
                    id="pref-low-att"
                    type="number"
                    min={1}
                    max={100}
                    value={lowAttendanceThreshold ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 100) {
                        onUpdateThreshold('lowAttendanceThreshold', val);
                      }
                    }}
                    className="min-h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="pref-urgent-att" className="text-xs font-bold text-foreground">
                    {t('dashboard.urgentAttendanceThresholdLabel')}
                  </label>
                  <Input
                    id="pref-urgent-att"
                    type="number"
                    min={1}
                    max={100}
                    value={urgentAttendanceThreshold ?? 60}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 100) {
                        onUpdateThreshold('urgentAttendanceThreshold', val);
                      }
                    }}
                    className="min-h-10 text-sm"
                  />
                </div>
              </div>
            </CustomizeSectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
