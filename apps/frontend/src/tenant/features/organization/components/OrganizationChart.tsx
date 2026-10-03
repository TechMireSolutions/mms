import React, { useState } from 'react';
import { Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { useTranslation } from '@/hooks/useTranslation';
import { useOrganizationTree } from '@/tenant/hooks/collections/organization';
import { OrganizationPositionNode } from './OrganizationPositionNode';
import { OrganizationBlueprintModal } from './OrganizationBlueprintModal';

export interface OrganizationChartProps {
  canWrite?: boolean;
}

export function OrganizationChart({ canWrite = true }: OrganizationChartProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: tree = [], isLoading, refetch } = useOrganizationTree();
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 1.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.6));
  const handleResetZoom = () => setScale(1);

  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="p-1.5 rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh chart"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Reset zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {canWrite ? (
          <button
            type="button"
            onClick={() => setBlueprintModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            <span>{t('organization.applyBlueprint')}</span>
          </button>
        ) : null}
      </div>

      {/* Tree Canvas */}
      {tree.length === 0 ? (
        <EmptyState
          title="No Organization Structure"
          description="Initialize your organization structure by applying an industry template or creating root positions."
          action={
            canWrite ? (
              <button
                type="button"
                onClick={() => setBlueprintModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>{t('organization.applyBlueprint')}</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-muted/10 p-8 overflow-auto min-h-[500px] flex justify-center">
          <div
            className="transition-transform duration-150 origin-top flex items-start gap-12"
            style={{ transform: `scale(${scale})` }}
          >
            {tree.map((rootNode) => (
              <OrganizationPositionNode
                key={rootNode.id}
                node={rootNode}
                canWrite={canWrite}
              />
            ))}
          </div>
        </div>
      )}

      <OrganizationBlueprintModal
        open={blueprintModalOpen}
        onClose={() => setBlueprintModalOpen(false)}
        onApplied={() => void refetch()}
      />
    </div>
  );
}
