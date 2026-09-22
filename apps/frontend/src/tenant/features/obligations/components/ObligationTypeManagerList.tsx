import { Pencil, Trash2 } from "lucide-react";
import { type ObligationType } from '@/lib/data/obligationsData';
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { useTranslation } from "@/hooks/useTranslation";

interface ObligationTypeManagerListProps {
  types: ObligationType[];
  designatedConfig: Record<string, StatusBadgeConfigItem>;
  quantityConfig: Record<string, StatusBadgeConfigItem>;
  onEdit: (obligationType: ObligationType) => void;
  onDelete: (obligationTypeId: string) => void;
}

interface ObligationTypeCardProps {
  obligationType: ObligationType;
  quantityConfig: Record<string, StatusBadgeConfigItem>;
  designatedConfig: Record<string, StatusBadgeConfigItem>;
  onEdit: (obligationType: ObligationType) => void;
  onDelete: (obligationTypeId: string) => void;
}

function ObligationTypeCard({
  obligationType,
  quantityConfig,
  designatedConfig,
  onEdit,
  onDelete,
}: ObligationTypeCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { cardProps, onEdit: handleEdit } = useWorkCardAction({
    entity: obligationType,
    selectedIds: [],
    canSelect: false,
    onEdit,
  });

  return (
    <DirectoryEntityCard
      className="space-y-3 p-4"
      {...cardProps}
    >
      <DirectoryCardHeader
        id={obligationType.id}
        displayName={obligationType.name}
        isSelected={false}
        onSelect={() => {}}
        selectAriaLabel=""
        showSelect={false}
        onView={handleEdit}
        viewAriaLabel={t("obligations.types.editAria", { name: obligationType.name })}
      />
      <DirectoryCardMetaGrid className="pt-2 border-t border-border/40 ms-0">
        <DirectoryCardMetaTile label={t("obligations.types.colQuantity")}>
          <StatusBadge status={obligationType.quantity_based ? "yes" : "no"} config={quantityConfig} size="sm" />
        </DirectoryCardMetaTile>
        <DirectoryCardMetaTile label={t("obligations.types.colDesignated")}>
          <StatusBadge status={obligationType.designated_for} config={designatedConfig} size="sm" />
        </DirectoryCardMetaTile>
      </DirectoryCardMetaGrid>
      <DirectoryCardFooterActions
        actions={
          <>
            <Button
              type="button"
              aria-label={t("obligations.types.editAria", { name: obligationType.name })}
              onClick={handleEdit}
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              aria-label={t("obligations.types.deleteAria", { name: obligationType.name })}
              onClick={() => onDelete(obligationType.id)}
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 rounded-xl border border-border/50 dark:border-border/30 hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </>
        }
      />
    </DirectoryEntityCard>
  );
}

export function ObligationTypeManagerList({
  types,
  designatedConfig,
  quantityConfig,
  onEdit,
  onDelete,
}: ObligationTypeManagerListProps) {
  const { t } = useTranslation();

  const renderActions = (obligationType: ObligationType) => (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" aria-label={t("obligations.types.editAria", { name: obligationType.name })} onClick={() => onEdit(obligationType)}
        variant="ghost"
        size="icon"
        className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      <Button type="button" aria-label={t("obligations.types.deleteAria", { name: obligationType.name })} onClick={() => onDelete(obligationType.id)}
        variant="ghost"
        size="icon"
        className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </div>
  );

  return (
    <section aria-label={t("obligations.types")} className={WORK_SURFACE}>
      {types.length === 0 ? (
        <EmptyState title={t("obligations.types.empty")} compact className="md:hidden" />
      ) : (
        <div className="space-y-3 p-3 md:hidden">
          {types.map((obligationType) => (
            <ObligationTypeCard
              key={obligationType.id}
              obligationType={obligationType}
              quantityConfig={quantityConfig}
              designatedConfig={designatedConfig}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("obligations.types")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="name" className="px-3 py-2.5">{t("obligations.types.colName")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="quantity" className="px-3 py-2.5">{t("obligations.types.colQuantity")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="designated" className="px-3 py-2.5">{t("obligations.types.colDesignated")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="actions" className="px-3 py-2.5 text-end"><span className="sr-only">{t("common.actions")}</span></ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {types.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-4"><EmptyState title={t("obligations.types.empty")} compact /></TableCell></TableRow>
            )}
            {types.map((obligationType) => (
              <TableRow key={obligationType.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 font-semibold text-foreground">{obligationType.name}</TableCell>
                <TableCell className="px-3 py-2.5">
                  <StatusBadge status={obligationType.quantity_based ? "yes" : "no"} config={quantityConfig} size="sm" />
                </TableCell>
                <TableCell className="px-3 py-2.5">
                  <StatusBadge status={obligationType.designated_for} config={designatedConfig} size="sm" />
                </TableCell>
                <TableCell className="px-3 py-2.5 text-end">{renderActions(obligationType)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
