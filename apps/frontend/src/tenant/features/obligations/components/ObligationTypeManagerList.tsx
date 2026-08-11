import { Pencil, Trash2 } from "lucide-react";
import { ObligationType } from '@/lib/data/obligationsData';
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
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";

interface ObligationTypeManagerListProps {
  types: ObligationType[];
  designatedConfig: Record<string, StatusBadgeConfigItem>;
  quantityConfig: Record<string, StatusBadgeConfigItem>;
  onEdit: (obligationType: ObligationType) => void;
  onDelete: (obligationTypeId: string) => void;
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
            <article
              key={obligationType.id}
              className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{obligationType.name}</p>
                {renderActions(obligationType)}
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.types.colQuantity")}</dt>
                  <dd>
                    <StatusBadge status={obligationType.quantity_based ? "yes" : "no"} config={quantityConfig} size="sm" />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.types.colDesignated")}</dt>
                  <dd>
                    <StatusBadge status={obligationType.designated_for} config={designatedConfig} size="sm" />
                  </dd>
                </div>
              </dl>
            </article>
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
