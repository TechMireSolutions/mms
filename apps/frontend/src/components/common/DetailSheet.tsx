import React from "react";
import { RotateCcw } from "lucide-react";
import {
  DetailDrawerShell,
  type DetailDrawerShellProps,
  type DetailDrawerSize,
} from "@/components/ui/DetailDrawerShell";
import { DetailDrawerArchivedBanner } from "@/components/ui/DetailDrawerArchiveChrome";
import { Button } from "@/components/ui/button";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { DetailAttributeRow, type DetailAttributeRowVariant } from "@/components/ui/DetailAttributeRow";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { getEntityDescriptor } from "@/components/common/entityRegistry";
import { useTranslation } from "@/hooks/useTranslation";

export type { DetailDrawerSize };

export interface DetailSheetProps<T = unknown> extends Omit<DetailDrawerShellProps, "children"> {
  children?: React.ReactNode;
  /** Optional soft-delete / archive state to automatically display WarningCallout and Restore button. */
  archiveState?: {
    isDeleted: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    canRestore?: boolean;
    onRestore?: () => void;
    recordTitle?: string;
    restoreLabel?: string;
  };
  /** Entity domain type name to look up in declarative SSOT registry */
  entityType?: string;
  /** Declarative SSOT entity descriptor */
  descriptor?: EntityDescriptor<T>;
  /** Entity data instance to render descriptor sections and attributes */
  entity?: T;
  /** Attribute row style variant ('card' | 'list' | 'inset') */
  attributeVariant?: DetailAttributeRowVariant;
}

/**
 * Universal DetailSheet primitive.
 * BiDi-aware Radix/Framer slide-over drawer from inline-end with responsive bottom-sheet adaptation on mobile,
 * optional integrated archive banner, and declarative SSOT entity descriptor attribute rendering.
 */
export function DetailSheet<T = unknown>({
  archiveState,
  entityType,
  descriptor,
  entity,
  attributeVariant = "card",
  children,
  ...props
}: DetailSheetProps<T>): React.JSX.Element | null {
  const effectiveDescriptor = (descriptor ?? (entityType ? (getEntityDescriptor(entityType) as EntityDescriptor<T> | undefined) : undefined));

  const { t } = useTranslation();

  return (
    <DetailDrawerShell {...props}>
      {archiveState?.isDeleted ? (
        <div className="mb-4 space-y-2">
          <DetailDrawerArchivedBanner
            deletedAt={archiveState.deletedAt}
            title={archiveState.recordTitle ? t("common.archiveTitle", { title: archiveState.recordTitle }) : undefined}
            description={
              archiveState.deletedBy ? t("common.archiveBy", { name: archiveState.deletedBy }) : undefined
            }
          />
          {archiveState.canRestore && archiveState.onRestore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={archiveState.onRestore}
              className="w-full gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {archiveState.restoreLabel ?? t("common.restore")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {effectiveDescriptor && entity ? (
        <div className="space-y-6 mb-4">
          {effectiveDescriptor.getDrawerSections().map((section) => (
            <div key={section.id} className="space-y-2">
              <DetailSectionTitle>{section.title}</DetailSectionTitle>
              <div className="space-y-2">
                {section.fields.map((field) => {
                  const val = effectiveDescriptor.renderFieldValue(field.key, entity);
                  return (
                    <DetailAttributeRow
                      key={field.key}
                      label={field.label}
                      value={val}
                      icon={field.icon}
                      variant={attributeVariant}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {children}
    </DetailDrawerShell>
  );
}
