import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, MapPin, Building, Plus } from 'lucide-react';
import type { OrganizationPositionTreeNode } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

export interface OrganizationPositionNodeProps {
  node: OrganizationPositionTreeNode;
  onSelectPosition?: (node: OrganizationPositionTreeNode) => void;
  onAddChild?: (parent: OrganizationPositionTreeNode) => void;
  canWrite?: boolean;
}

export function OrganizationPositionNode({
  node,
  onSelectPosition,
  onAddChild,
  canWrite = true,
}: OrganizationPositionNodeProps): React.JSX.Element {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const occupiedCount = node.occupants?.length ?? 0;
  const isVacant = occupiedCount === 0;
  const isFull = occupiedCount >= node.capacity;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className="w-72 rounded-lg border border-border bg-card shadow-xs hover:shadow-md transition-shadow p-3.5 space-y-2.5 text-start cursor-pointer border-t-4 border-t-primary"
        onClick={() => onSelectPosition?.(node)}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {node.code}
            </span>
            <h4 className="font-semibold text-sm text-foreground leading-snug mt-1">
              {node.name}
            </h4>
          </div>

          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              isVacant
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                : isFull
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            {occupiedCount} / {node.capacity}{' '}
            {isVacant
              ? t('organization.vacant')
              : isFull
                ? t('organization.full')
                : t('organization.filled')}
          </span>
        </div>

        {/* Metadata Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {node.departmentName ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-[11px]">
              <Building className="h-3 w-3" />
              {node.departmentName}
            </span>
          ) : null}

          {node.locationName ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-[11px]">
              <MapPin className="h-3 w-3" />
              {node.locationName}
            </span>
          ) : null}
        </div>

        {/* Occupants List */}
        <div className="pt-2 border-t border-border/50 text-xs">
          {occupiedCount > 0 ? (
            <div className="space-y-1">
              {node.occupants.map((occ) => (
                <div key={occ.assignmentId} className="flex items-center gap-2 text-foreground font-medium">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                    {occ.facultyName.charAt(0)}
                  </div>
                  <span className="truncate">{occ.facultyName}</span>
                  {occ.employeeId ? (
                    <span className="text-[10px] text-muted-foreground font-mono">({occ.employeeId})</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground italic text-[11px]">
              <User className="h-3.5 w-3.5" />
              <span>{t('organization.positionOpen')}</span>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-1 text-xs">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(!collapsed);
              }}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px] font-medium"
            >
              {collapsed ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>{t('organization.showSubBranches', { count: node.children.length })}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>{t('organization.collapseBranch')}</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">{t('organization.leafPosition')}</span>
          )}

          {canWrite && onAddChild ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node);
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-11 min-w-11 inline-flex items-center justify-center"
              title={t('organization.addSubordinate')}
              aria-label={t('organization.addSubordinate')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Children Tree Branch */}
      {hasChildren && !collapsed ? (
        <div className="relative pt-6">
          {/* Connector vertical line down from parent */}
          <div className="absolute top-0 start-1/2 -translate-x-1/2 w-0.5 h-6 bg-border" />

          {/* Children container */}
          <div className="flex items-start justify-center gap-8 relative">
            {/* Horizontal line across children */}
            {node.children.length > 1 ? (
              <div className="absolute top-0 start-36 end-36 h-0.5 bg-border" />
            ) : null}

            {node.children.map((child) => (
              <div key={child.id} className="relative pt-4">
                {/* Connector vertical line to child */}
                <div className="absolute top-0 start-1/2 -translate-x-1/2 w-0.5 h-4 bg-border" />
                <OrganizationPositionNode
                  node={child}
                  onSelectPosition={onSelectPosition}
                  onAddChild={onAddChild}
                  canWrite={canWrite}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
