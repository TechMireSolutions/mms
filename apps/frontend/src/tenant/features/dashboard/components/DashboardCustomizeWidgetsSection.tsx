import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { getCollectionLabel } from '@/lib/reports/reportMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { isSeededDashboardWidget, resolveWidgetTitle } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CustomizeItemRow } from '@/tenant/features/dashboard/components/CustomizeItemRow';
import { CustomizeSectionCard } from '@/tenant/features/dashboard/components/CustomizeSectionCard';

export interface DashboardCustomizeWidgetsSectionProps {
  customWidgets: CustomWidget[];
  pinnedDashboardWidgetCount: number;
  onEditWidget: (widget: CustomWidget) => void;
  onDeleteWidget: (widgetId: string) => void;
  onToggleWidgetPin: (widgetId: string) => void;
  onOpenWidgetBuilder: (type: CustomWidget['widgetType'], widget?: CustomWidget | null) => void;
}

export function DashboardCustomizeWidgetsSection({
  customWidgets,
  pinnedDashboardWidgetCount,
  onEditWidget,
  onDeleteWidget,
  onToggleWidgetPin,
  onOpenWidgetBuilder,
}: DashboardCustomizeWidgetsSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <CustomizeSectionCard
      title={t('dashboard.chartsWidgetsSettings')}
      description={t('dashboard.chartsWidgetsSettingsDesc')}
      maxHeightClass="max-h-[16.25rem]"
      headerContent={
        <div className="space-y-0.5">
          <p className="font-bold text-foreground">
            {t('dashboard.pinnedCharts', { count: pinnedDashboardWidgetCount })}
          </p>
          <p className="text-xs text-muted-foreground/80 font-semibold">
            {t('dashboard.totalWidgets', { count: customWidgets.length })}
          </p>
        </div>
      }
      footer={
        <Button
          variant="capsOutline"
          size="caps"
          onClick={() => onOpenWidgetBuilder('kpi', null)}
          className="w-full border-dashed border-border/80 hover:border-primary/50 py-3.5"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.createWidget')}
        </Button>
      }
    >
      {customWidgets.length === 0 ? (
        <EmptyState title={t('dashboard.noWidgets')} compact icon={null} className="italic" />
      ) : (
        customWidgets.map((widget) => (
          <CustomizeItemRow
            key={widget.id}
            id={`widget-pin-${widget.id}`}
            checked={Boolean(widget.isPinnedToDashboard)}
            onToggle={() => onToggleWidgetPin(widget.id)}
            title={resolveWidgetTitle(widget, t)}
            subtitle={getCollectionLabel(widget.collection, widget.collection, t)}
            actions={
              <>
                <Button
                  onClick={() => onEditWidget(widget)}
                  variant="ghost"
                  size="icon"
                  className="border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shadow-none cursor-pointer rounded-lg"
                  title={t('dashboard.editWidget')}
                  aria-label={t('dashboard.editWidget')}
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
                    aria-label={t('dashboard.deleteWidget')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            }
          />
        ))
      )}
    </CustomizeSectionCard>
  );
}
