import React from 'react';
import { Info } from 'lucide-react';
import type { BlueprintPreviewDiff } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

export interface OrganizationBlueprintDiffGridProps {
  previewDiff: BlueprintPreviewDiff;
}

export function OrganizationBlueprintDiffGrid({
  previewDiff,
}: OrganizationBlueprintDiffGridProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Info className="h-3.5 w-3.5 text-primary" />
        <span>{t('organization.blueprint.diff')}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-background border border-border">
          <div className="text-muted-foreground text-[11px]">{t('organization.positions')}</div>
          <div className="font-medium text-foreground">
            +{previewDiff.positions.toCreate.length} new
            <span className="text-muted-foreground text-[10px] ml-1">
              ({previewDiff.positions.existing.length} exist)
            </span>
          </div>
        </div>
        <div className="p-2 rounded bg-background border border-border">
          <div className="text-muted-foreground text-[11px]">{t('organization.locations')}</div>
          <div className="font-medium text-foreground">
            +{previewDiff.locations.toCreate.length} new
            <span className="text-muted-foreground text-[10px] ml-1">
              ({previewDiff.locations.existing.length} exist)
            </span>
          </div>
        </div>
        <div className="p-2 rounded bg-background border border-border">
          <div className="text-muted-foreground text-[11px]">Departments</div>
          <div className="font-medium text-foreground">
            +{previewDiff.departments.toCreate.length} new
            <span className="text-muted-foreground text-[10px] ml-1">
              ({previewDiff.departments.existing.length} exist)
            </span>
          </div>
        </div>
        <div className="p-2 rounded bg-background border border-border">
          <div className="text-muted-foreground text-[11px]">Designations</div>
          <div className="font-medium text-foreground">
            +{previewDiff.designations.toCreate.length} new
            <span className="text-muted-foreground text-[10px] ml-1">
              ({previewDiff.designations.existing.length} exist)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
