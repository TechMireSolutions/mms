import React from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  METADATA_FIELDS,
  getCollectionLabel,
} from '@/lib/reports/reportMetadata';
import { useTranslation } from '@/hooks/useTranslation';
import { isSeededDashboardWidget, resolveWidgetTitle } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { WORK_SURFACE } from '@/components/ui/formStyles';

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
    <div className={`${WORK_SURFACE} p-6`}>
      <fieldset className="space-y-4 border-0 p-0 m-0">
        <SectionLabel as="legend" tone="primary" className="leading-none mb-1">
          {t('dashboard.chartsWidgetsSettings')}
        </SectionLabel>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('dashboard.chartsWidgetsSettingsDesc')}</p>

        <div className="text-xs border-b border-border/45 pb-3 space-y-0.5">
          <p className="font-bold text-foreground">
            {t('dashboard.pinnedCharts', { count: pinnedDashboardWidgetCount })}
          </p>
          <p className="text-xs text-muted-foreground/80 font-semibold">
            {t('dashboard.totalWidgets', { count: customWidgets.length })}
          </p>
        </div>

        <div className="space-y-2 max-h-[16.25rem] overflow-y-auto pe-1">
          {customWidgets.length === 0 ? (
            <EmptyState title={t('dashboard.noWidgets')} compact icon={null} className="italic" />
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
                    className="min-w-0 flex-1 cursor-pointer select-none space-y-0.5 truncate text-start"
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
          variant="capsOutline"
          size="caps"
          onClick={() => onOpenWidgetBuilder('kpi', null)}
          className="w-full border-dashed border-border/80 hover:border-primary/50 py-3.5"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.createWidget')}
        </Button>
      </fieldset>
    </div>
  );
}
