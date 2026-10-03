import React, { useState } from 'react';
import { Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react';
import type { OrganizationPositionTreeNode } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingState';
import { useTranslation } from '@/hooks/useTranslation';
import { useOrganizationTree } from '@/tenant/hooks/collections/organization';
import { OrganizationPositionNode } from './OrganizationPositionNode';
import { OrganizationBlueprintModal } from './OrganizationBlueprintModal';
import { OrganizationPositionFormModal } from './OrganizationPositionFormModal';

export interface OrganizationChartProps {
  canWrite?: boolean;
}

export function OrganizationChart({ canWrite = true }: OrganizationChartProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: tree = [], isLoading, refetch } = useOrganizationTree();
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [parentForCreate, setParentForCreate] = useState<OrganizationPositionTreeNode | null>(null);
  const [editNode, setEditNode] = useState<OrganizationPositionTreeNode | null>(null);
  const [positionModalOpen, setPositionModalOpen] = useState(false);

  if (isLoading) return <CardSkeleton count={3} />;

  function openCreate(parent: OrganizationPositionTreeNode | null = null) {
    setEditNode(null);
    setParentForCreate(parent);
    setPositionModalOpen(true);
  }

  function openEdit(node: OrganizationPositionTreeNode) {
    setParentForCreate(null);
    setEditNode(node);
    setPositionModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => void refetch()} aria-label={t('organization.chart.refresh')}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => setScale((s) => Math.min(s + 0.1, 1.5))} aria-label={t('organization.chart.zoomIn')}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => setScale((s) => Math.max(s - 0.1, 0.6))} aria-label={t('organization.chart.zoomOut')}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => setScale(1)} aria-label={t('organization.chart.resetZoom')}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="min-h-11 gap-1.5" onClick={() => openCreate(null)}>
              <Plus className="h-4 w-4" />
              {t('organization.position.addRoot')}
            </Button>
            <Button type="button" className="min-h-11 gap-1.5" onClick={() => setBlueprintModalOpen(true)}>
              <Sparkles className="h-4 w-4" />
              {t('organization.applyBlueprint')}
            </Button>
          </div>
        ) : null}
      </div>

      {tree.length === 0 ? (
        <EmptyState
          title={t('organization.chart.emptyTitle')}
          description={t('organization.chart.emptyDescription')}
          action={
            canWrite ? (
              <Button type="button" className="min-h-11 gap-1.5" onClick={() => setBlueprintModalOpen(true)}>
                <Sparkles className="h-4 w-4" />
                {t('organization.applyBlueprint')}
              </Button>
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
                onSelectPosition={openEdit}
                onAddChild={(parent) => openCreate(parent)}
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
      <OrganizationPositionFormModal
        open={positionModalOpen}
        onClose={() => setPositionModalOpen(false)}
        parent={parentForCreate}
        editNode={editNode}
      />
    </div>
  );
}
