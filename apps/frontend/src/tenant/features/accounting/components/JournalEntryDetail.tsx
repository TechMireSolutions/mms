import { Pencil, CheckCircle2, RotateCcw, Tag } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { ACCOUNT_TYPE_META, type Account, type JournalEntry } from '@/lib/data/accountingData';
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE, balanceToneClass } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { JournalEntryDetailLines } from "@/tenant/features/accounting/components/JournalEntryDetailLines";
import { Card } from "@/components/ui/card";
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { DetailAttributeRow } from '@/components/ui/DetailAttributeRow';

interface JournalEntryDetailProps {
  entry: JournalEntry;
  accounts: Account[];
  onClose: () => void;
  onEdit?: () => void;
  onReverse?: () => void;
}

/**
 * Journal entry detail slide-over.
 */
export function JournalEntryDetail({ entry, accounts, onClose, onEdit, onReverse }: JournalEntryDetailProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const journalStatusConfig: Record<string, StatusBadgeConfigItem> = {
    posted: { label: t("accounting.journal.status.posted"), cls: SEMANTIC_BADGE.successStrong },
    draft: { label: t("accounting.journal.status.draft"), cls: SEMANTIC_BADGE.warningStrong },
  };
  const accountTypeConfig = (() => {
    const config: Record<string, StatusBadgeConfigItem> = {};
    for (const [type, meta] of Object.entries(ACCOUNT_TYPE_META)) {
      config[type] = {
        label: t(`accounting.type.${type}` as AppTranslationKey),
        cls: meta.color,
      };
    }
    return config;
  })() as Record<string, StatusBadgeConfigItem>;
  const getAccount = (id: string) => accounts.find((account) => account.id === id);
  const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
  const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);

  return (
    <DetailDrawerShell
      open
      onClose={onClose}
      title={entry.ref}
      icon={Tag}
      className="max-w-2xl"
      headerExtra={
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />
          {entry.reversed_ref && (
            <Badge pill tone="warning" className="px-2 font-semibold border-warning/30">
              ↩ {t("accounting.journal.detail.reversalOf", { ref: entry.reversed_ref })}
            </Badge>
          )}
        </div>
      }
      headerActions={
        <div className="flex items-center gap-2">
          {entry.status === "draft" && onEdit && (
            <Button type="button" variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold">
              <Pencil className="w-3 h-3" aria-hidden="true" /> {t("accounting.journal.detail.edit")}
            </Button>
          )}
          {entry.status === "posted" && onReverse && (
            <Button type="button" variant="outline" size="sm" onClick={onReverse} className="flex items-center gap-1 text-xs font-semibold border-warning/30 text-warning hover:bg-warning/10 hover:text-warning">
              <RotateCcw className="w-3 h-3" aria-hidden="true" /> {t("accounting.journal.detail.reverse")}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <DetailSectionTitle>{t("common.overview" as AppTranslationKey)}</DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">
            <DetailAttributeRow variant="inset" label={t("accounting.journal.detail.date")} value={formatDate(entry.date)} />
            <DetailAttributeRow variant="inset" label={t("accounting.journal.detail.createdBy")} value={entry.created_by || "—"} />
            <DetailAttributeRow variant="inset" label={t("accounting.journal.detail.fiscalYear")} value={entry.fiscal_year || "—"} />
            <DetailAttributeRow variant="inset" label={t("accounting.journal.detail.narration")} value={entry.description} />
          </Card>
        </div>

          {(entry.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label={t("accounting.columns.journal.tags")}>
              <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              {entry.tags!.map((tag) => (
                <Badge key={tag} pill tone="primary" className="px-2 font-bold">
                  {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
                </Badge>
              ))}
            </div>
          )}

          <JournalEntryDetailLines
            entry={entry}
            accountTypeConfig={accountTypeConfig}
            getAccount={getAccount}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            formatCurrency={formatCurrency}
            t={t}
          />

          <div className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border", balanceToneClass(Math.abs(totalDebit - totalCredit) < 0.01))} role="status">
            {Math.abs(totalDebit - totalCredit) < 0.01
              ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.detail.balanced")}</>
              : <>{t("accounting.journal.detail.unbalanced", { diff: formatCurrency(Math.abs(totalDebit - totalCredit)) })}</>
            }
          </div>
      </div>
    </DetailDrawerShell>
  );
}
