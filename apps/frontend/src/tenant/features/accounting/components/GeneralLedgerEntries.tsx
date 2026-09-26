import React, { useMemo } from "react";
import { formatDate } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work/WorkBatchTable";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { type Account } from '@/lib/data/accountingData';
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { GeneralLedgerLineWithRunning } from "./useGeneralLedger";

interface GeneralLedgerEntriesProps {
  activeAccount: Account;
  linesWithRunning: GeneralLedgerLineWithRunning[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
  dateFrom: string;
  dateTo: string;
  viewMode?: WorkDirectoryViewMode;
}

type GeneralLedgerRowItem = GeneralLedgerLineWithRunning & { id: string };

export function GeneralLedgerEntries({
  activeAccount,
  linesWithRunning,
  totalDebit,
  totalCredit,
  balance,
  dateFrom,
  dateTo,
  viewMode: propViewMode,
}: GeneralLedgerEntriesProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;

  const rows = useMemo<GeneralLedgerRowItem[]>(
    () => linesWithRunning.map((line, index) => ({ ...line, id: `${line.ref}-${index}` })),
    [linesWithRunning],
  );

  const columns = useMemo<WorkBatchTableColumn<GeneralLedgerRowItem>[]>(
    () => [
      {
        id: "date",
        label: t("accounting.ledger.columns.date"),
        cellClassName: "px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap",
        render: (line) => formatDate(line.date),
      },
      {
        id: "ref",
        label: t("accounting.ledger.columns.ref"),
        cellClassName: "px-3 py-2.5 font-mono text-xs font-bold text-primary",
        render: (line) => line.ref,
      },
      {
        id: "description",
        label: t("accounting.ledger.columns.description"),
        cellClassName: "px-3 py-2.5 text-foreground max-w-cell-md truncate",
        render: (line) => line.description,
      },
      {
        id: "lineNote",
        label: t("accounting.ledger.columns.lineNote"),
        headerClassName: "hidden lg:table-cell",
        cellClassName: "px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell",
        render: (line) => line.lineDesc || "—",
      },
      {
        id: "debit",
        label: t("accounting.ledger.columns.debit"),
        headerClassName: "text-end",
        cellClassName: "px-3 py-2.5 text-end font-mono text-xs font-semibold text-info",
        render: (line) => (line.debit > 0 ? formatCurrency(line.debit) : "—"),
      },
      {
        id: "credit",
        label: t("accounting.ledger.columns.credit"),
        headerClassName: "text-end",
        cellClassName: "px-3 py-2.5 text-end font-mono text-xs font-semibold text-success",
        render: (line) => (line.credit > 0 ? formatCurrency(line.credit) : "—"),
      },
      {
        id: "balance",
        label: t("accounting.ledger.columns.balance"),
        headerClassName: "text-end",
        cellClassName: "px-3 py-2.5 text-end font-mono text-xs font-semibold",
        render: (line) => (
          <>
            <span className={line.running >= 0 ? "text-foreground" : "text-destructive"}>
              {formatCurrency(Math.abs(line.running))}
            </span>
            <span className="text-xs text-muted-foreground ms-1">
              {line.running >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}
            </span>
          </>
        ),
      },
    ],
    [formatCurrency, t],
  );

  if (linesWithRunning.length === 0) {
    return (
      <EmptyState
        variant="dashed"
        title={dateFrom || dateTo ? t("accounting.ledger.noPostedTransactionsPeriod") : t("accounting.ledger.noPostedTransactions")}
        compact
      />
    );
  }

  if (viewMode === "cards") {
    return (
      <div className={WORK_SURFACE}>
        <DirectoryCardsGrid className="p-3">
          {linesWithRunning.map((line, index) => (
            <DirectoryEntityCard
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
            </DirectoryEntityCard>
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
        </DirectoryCardsGrid>
      </div>
    );
  }

  const tableFooter = (
    <TableFooter className="border-t-2 border-border bg-muted/30">
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={3} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">
          {t("accounting.ledger.closingBalance")}
        </TableCell>
        <TableCell className="hidden lg:table-cell" />
        <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-info">
          {formatCurrency(totalDebit)}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success">
          {formatCurrency(totalCredit)}
        </TableCell>
        <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-foreground">
          {formatCurrency(Math.abs(balance))} {balance >= 0 ? t("accounting.ledger.dr") : t("accounting.ledger.cr")}
        </TableCell>
      </TableRow>
    </TableFooter>
  );

  return (
    <div className={WORK_SURFACE}>
      <WorkBatchTable
        data={rows}
        columns={columns}
        caption={t("accounting.ledger.entriesCaption", { name: activeAccount.name })}
        bordered={false}
        tableFooter={tableFooter}
      />
    </div>
  );
}
