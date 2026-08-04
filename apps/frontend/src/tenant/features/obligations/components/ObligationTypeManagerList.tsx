import { Pencil, Trash2 } from "lucide-react";
import { ObligationType } from '@/lib/data/obligationsData';
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
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
    <section aria-label={t("obligations.types")} className="rounded-xl border border-border overflow-hidden">
      {types.length === 0 ? (
        <EmptyState title={t("obligations.types.empty")} compact className="md:hidden" />
      ) : (
        <div className="space-y-3 p-3 md:hidden">
          {types.map((obligationType) => (
            <article
              key={obligationType.id}
              className="space-y-3 rounded-xl border border-border bg-card p-3"
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("obligations.types")}</caption>
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.types.colName")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.types.colQuantity")}</th>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.types.colDesignated")}</th>
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase"><span className="sr-only">{t("common.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types.length === 0 && (
              <tr><td colSpan={4} className="py-4"><EmptyState title={t("obligations.types.empty")} compact /></td></tr>
            )}
            {types.map((obligationType) => (
              <tr key={obligationType.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">{obligationType.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={obligationType.quantity_based ? "yes" : "no"} config={quantityConfig} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={obligationType.designated_for} config={designatedConfig} size="sm" />
                </td>
                <td className="px-4 py-3 text-end">{renderActions(obligationType)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
