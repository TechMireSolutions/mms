import React, { useState } from 'react';
import { Sparkles, Building2, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/LoadingState';
import {
  useOrganizationBlueprints,
  useApplyBlueprint,
} from '@/tenant/hooks/collections/organization';
import { useTranslation } from '@/hooks/useTranslation';

export interface OrganizationBlueprintModalProps {
  open: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export function OrganizationBlueprintModal({
  open,
  onClose,
  onApplied,
}: OrganizationBlueprintModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: blueprints = [], isLoading } = useOrganizationBlueprints({ enabled: open });
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('madrasa-standard-v1');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyBlueprintMutation = useApplyBlueprint();

  const handleApply = async () => {
    if (!selectedBlueprintId) return;
    setError(null);
    try {
      await applyBlueprintMutation.mutateAsync({
        blueprintId: selectedBlueprintId,
        replaceExisting,
      });
      onApplied?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply blueprint');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('organization.applyBlueprint')}
      icon={Sparkles}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md border border-input text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applyBlueprintMutation.isPending || !selectedBlueprintId}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{applyBlueprintMutation.isPending ? 'Applying...' : 'Apply Template'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <p className="text-xs text-muted-foreground">
          Select an industry-standard template to automatically initialize locations, departments,
          and positions for your organization.
        </p>

        {error ? (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {isLoading ? (
          <CardSkeleton count={2} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {blueprints.map((bp) => {
              const isSelected = selectedBlueprintId === bp.id;
              return (
                <div
                  key={bp.id}
                  onClick={() => setSelectedBlueprintId(bp.id)}
                  className={`relative p-3.5 rounded-lg border text-start cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                      : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm text-foreground">{bp.name}</h4>
                    </div>
                    {isSelected ? (
                      <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
                    {bp.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                    <span>{bp.positions?.length ?? 0} Positions</span>
                    <span>•</span>
                    <span>{bp.locations?.length ?? 0} Locations</span>
                    <span>•</span>
                    <span className="uppercase">{bp.industryType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <div className="text-xs">
              <span className="font-medium text-foreground">
                Replace existing unassigned positions and locations
              </span>
              <p className="text-muted-foreground">
                If checked, positions without active assignments will be cleanly refreshed with the new template.
              </p>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
}
