import React from 'react';
import { Info } from 'lucide-react';
import type { BlueprintPreviewDiff } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useIndustryTerminology } from '@/tenant/hooks/useIndustryTerminology';

export interface OrganizationBlueprintDiffGridProps {
  previewDiff: BlueprintPreviewDiff;
}

function DiffCell({
  label,
  createCount,
  existCount,
}: {
  label: string;
  createCount: number;
  existCount: number;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="p-2 rounded bg-background border border-border">
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div className="font-medium text-foreground">
        {t('organization.blueprint.diffCount', { create: createCount, exist: existCount })}
      </div>
    </div>
  );
}

export function OrganizationBlueprintDiffGrid({
  previewDiff,
}: OrganizationBlueprintDiffGridProps): React.JSX.Element {
  const { t } = useTranslation();
  const terminology = useIndustryTerminology();

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Info className="h-3.5 w-3.5 text-primary" />
        <span>{t('organization.blueprint.diff')}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <DiffCell
          label={t('organization.positions')}
          createCount={previewDiff.positions.toCreate.length}
          existCount={previewDiff.positions.existing.length}
        />
        <DiffCell
          label={terminology.locationLabel}
          createCount={previewDiff.locations.toCreate.length}
          existCount={previewDiff.locations.existing.length}
        />
        <DiffCell
          label={t('organization.departments')}
          createCount={previewDiff.departments.toCreate.length}
          existCount={previewDiff.departments.existing.length}
        />
        <DiffCell
          label={t('organization.designations')}
          createCount={previewDiff.designations.toCreate.length}
          existCount={previewDiff.designations.existing.length}
        />
      </div>
    </div>
  );
}
