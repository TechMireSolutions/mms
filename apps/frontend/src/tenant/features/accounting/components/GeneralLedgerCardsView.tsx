import React from "react";
import { formatDate } from "@mms/shared";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { EntityCardsGrid } from "@/components/ui/EntityCardsGrid";
import { EntityCard } from "@/components/ui/EntityCard";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { GeneralLedgerLineWithRunning } from "./useGeneralLedger";

export interface GeneralLedgerCardsViewProps {
  linesWithRunning: GeneralLedgerLineWithRunning[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
  formatCurrency: (amount: number) => string;
  t: TranslationFunction;
}

export function GeneralLedgerCardsView({
  linesWithRunning,
  totalDebit,
  totalCredit,
  balance,
  formatCurrency,
  t,
}: GeneralLedgerCardsViewProps): React.JSX.Element {
  return (
    <div className={WORK_SURFACE}>
      <EntityCardsGrid className="p-3">
        {linesWithRunning.map((line, index) => (
          <EntityCard
            key={`${line.ref}-${index}`}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground m-0">{formatDate(line.date)}</p>
                <p className="truncate font-mono text-xs font-bold text-primary m-0 mt-0.5">{line.ref}</p>
              </div>
              <div className="shrink-0 text-end font-mono text-xs font-semibold">
                <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
                  {formatCurrency(Math.abs(line.running))}
                </span>
                <span className="text-xs text-muted-foreground ms-1">{line.running >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}</span>
              </div>
            </div>
            <p className="text-sm text-foreground m-0">{line.description}</p>
            {line.lineDesc ? (
              <p className="text-xs text-muted-foreground m-0">{line.lineDesc}</p>
            ) : null}
            <StatGrid>
              <StatRow
                label={t("accounting.ledger.columns.debit")}
                value={line.debit > 0 ? formatCurrency(line.debit) : "—"}
                ddClassName="font-mono text-xs font-semibold text-info"
              />
              <StatRow
                label={t("accounting.ledger.columns.credit")}
                value={line.credit > 0 ? formatCurrency(line.credit) : "—"}
                ddClassName="font-mono text-xs font-semibold text-success"
              />
            </StatGrid>
          </EntityCard>
        ))}
        <article className="rounded-xl border border-border bg-muted/30 p-3 col-span-full">
          <p className="text-xs font-bold uppercase text-muted-foreground m-0 mb-2">{t("accounting.ledger.closingBalance")}</p>
          <StatGrid columns="sm3">
            <StatRow
              label={t("accounting.ledger.columns.debit")}
              value={formatCurrency(totalDebit)}
              ddClassName="font-mono font-bold text-info"
            />
            <StatRow
              label={t("accounting.ledger.columns.credit")}
              value={formatCurrency(totalCredit)}
              ddClassName="font-mono font-bold text-success"
            />
            <StatRow
              label={t("accounting.ledger.columns.balance")}
              value={`${formatCurrency(Math.abs(balance))} ${balance >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}`}
              ddClassName="font-mono font-bold"
            />
          </StatGrid>
        </article>
      </EntityCardsGrid>
    </div>
  );
}
