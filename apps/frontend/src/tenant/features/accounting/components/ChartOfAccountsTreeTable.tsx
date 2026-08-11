import React from "react";
import { type AppTranslationKey } from "@mms/shared";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { Badge } from "@/components/ui/badge";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_META, type Account, type AccountType } from "@/lib/data/accountingData";
import { AccountMobileCard, AccountTableRow } from "@/tenant/features/accounting/components/ChartOfAccountsTreeRows";

interface ChartOfAccountsTreeTableProps {
  accounts: Account[];
  filteredAccounts: Account[];
  balanceConfig: Record<string, StatusBadgeConfigItem>;
  canWrite: boolean;
  isColumnVisible: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
}

export function ChartOfAccountsTreeTable({
  accounts,
  filteredAccounts,
  balanceConfig,
  canWrite,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  onEdit,
  onDelete,
  onReactivate,
}: ChartOfAccountsTreeTableProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-wrap gap-2" aria-label={t("accounting.coa.countsAria")}>
        {ACCOUNT_TYPES.map((type) => {
          const count = accounts.filter((account) => account.type === type && account.isActive !== false).length;
          if (count === 0) return null;
          return (
            <Badge key={type} pill variant="outline" className={`px-2.5 py-1 font-bold ${ACCOUNT_TYPE_META[type]?.color}`}>
              <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {t(`accounting.type.${type}` as AppTranslationKey)}: {count}
            </Badge>
          );
        })}
      </div>

      {ACCOUNT_TYPES.map((type) => {
        const accountTypeRows = filteredAccounts.filter((account) => account.type === type);
        if (accountTypeRows.length === 0) return null;
        return (
          <AccountTypeGroup
            key={type}
            type={type}
            accountTypeRows={accountTypeRows}
            balanceConfig={balanceConfig}
            canWrite={canWrite}
            isColumnVisible={isColumnVisible}
            getColumnWidth={getColumnWidth}
            onColumnResize={onColumnResize}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactivate={onReactivate}
          />
        );
      })}
    </>
  );
}

interface AccountTypeGroupProps extends Omit<ChartOfAccountsTreeTableProps, "accounts" | "filteredAccounts"> {
  type: AccountType;
  accountTypeRows: Account[];
}

function AccountTypeGroup({
  type,
  accountTypeRows,
  balanceConfig,
  canWrite,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  onEdit,
  onDelete,
  onReactivate,
}: AccountTypeGroupProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <article className={`${WORK_SURFACE} overflow-hidden`}>
      <header className={`px-4 py-2.5 border-b border-border ${ACCOUNT_TYPE_META[type]?.color} flex min-w-0 items-center justify-between gap-2`}>
        <SectionLabel as="h3" weight="bold" tracking="wide" tone="inherit" className="min-w-0 truncate m-0">
          <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {t("accounting.coa.groupHeader", { type: t(`accounting.type.${type}` as AppTranslationKey), group: t(`accounting.reports.views.${ACCOUNT_TYPE_META[type]?.group}` as AppTranslationKey) })}
        </SectionLabel>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {t("accounting.coa.groupMeta", {
            normal: ACCOUNT_TYPE_META[type]?.normalBalance === "debit" ? t("accounting.ledger.dr") : t("accounting.ledger.cr"),
            count: accountTypeRows.length,
          })}
        </span>
      </header>
      <div className="space-y-3 p-3 md:hidden">
        {accountTypeRows.map((account) => (
          <AccountMobileCard
            key={account.id}
            account={account}
            balanceConfig={balanceConfig}
            canWrite={canWrite}
            isColumnVisible={isColumnVisible}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactivate={onReactivate}
          />
        ))}
      </div>
      <div className="hidden md:block">
        <Table className="table-fixed">
          <caption className="sr-only">{t("accounting.coa.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
              {isColumnVisible("code") && (
                <ModuleTableHeaderCell columnKey="code" width={getColumnWidth?.("code")} onResize={onColumnResize} className="px-4 py-2">
                  {t("accounting.columns.account.code")}
                </ModuleTableHeaderCell>
              )}
              {isColumnVisible("name") && (
                <ModuleTableHeaderCell columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2">
                  {t("accounting.columns.account.name")}
                </ModuleTableHeaderCell>
              )}
              {isColumnVisible("subtype") && (
                <ModuleTableHeaderCell columnKey="subtype" width={getColumnWidth?.("subtype")} onResize={onColumnResize} className="px-4 py-2 hidden md:table-cell">
                  {t("accounting.columns.account.subtype")}
                </ModuleTableHeaderCell>
              )}
              {isColumnVisible("description") && (
                <ModuleTableHeaderCell columnKey="description" width={getColumnWidth?.("description")} onResize={onColumnResize} className="px-4 py-2 hidden lg:table-cell">
                  {t("accounting.columns.account.description")}
                </ModuleTableHeaderCell>
              )}
              {isColumnVisible("normalBalance") && (
                <ModuleTableHeaderCell columnKey="normalBalance" width={getColumnWidth?.("normalBalance")} onResize={onColumnResize} className="px-4 py-2">
                  {t("accounting.columns.account.normalBalance")}
                </ModuleTableHeaderCell>
              )}
              <TableHead className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase h-auto">
                {t("accounting.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {accountTypeRows.map((account) => (
              <AccountTableRow
                key={account.id}
                account={account}
                balanceConfig={balanceConfig}
                canWrite={canWrite}
                isColumnVisible={isColumnVisible}
                onEdit={onEdit}
                onDelete={onDelete}
                onReactivate={onReactivate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </article>
  );
}
