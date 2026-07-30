import React from "react";
import { type AppTranslationKey } from "@mms/shared";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_META, type Account, type AccountType } from "@/lib/data/accountingData";
import { AccountMobileCard, AccountTableRow } from "@/tenant/features/accounting/components/ChartOfAccountsTreeRows";

interface ChartOfAccountsTreeTableProps {
  accounts: Account[];
  filteredAccounts: Account[];
  balanceConfig: Record<string, StatusBadgeConfigItem>;
  canWrite: boolean;
  showCode: boolean;
  showName: boolean;
  showSubtype: boolean;
  showDescription: boolean;
  showNormalBalance: boolean;
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
  showCode,
  showName,
  showSubtype,
  showDescription,
  showNormalBalance,
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
            <span key={type} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ACCOUNT_TYPE_META[type]?.color}`}>
              <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {t(`accounting.type.${type}` as AppTranslationKey)}: {count}
            </span>
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
            showCode={showCode}
            showName={showName}
            showSubtype={showSubtype}
            showDescription={showDescription}
            showNormalBalance={showNormalBalance}
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
  showCode,
  showName,
  showSubtype,
  showDescription,
  showNormalBalance,
  getColumnWidth,
  onColumnResize,
  onEdit,
  onDelete,
  onReactivate,
}: AccountTypeGroupProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <article className="rounded-xl border border-border overflow-hidden">
      <header className={`px-4 py-2.5 border-b border-border ${ACCOUNT_TYPE_META[type]?.color} flex min-w-0 items-center justify-between gap-2`}>
        <h3 className="min-w-0 truncate text-xs font-bold uppercase tracking-wide m-0">
          <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {t("accounting.coa.groupHeader", { type: t(`accounting.type.${type}` as AppTranslationKey), group: t(`accounting.reports.views.${ACCOUNT_TYPE_META[type]?.group}` as AppTranslationKey) })}
        </h3>
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
            showCode={showCode}
            showName={showName}
            showSubtype={showSubtype}
            showDescription={showDescription}
            showNormalBalance={showNormalBalance}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactivate={onReactivate}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm table-fixed">
          <caption className="sr-only">{t("accounting.coa.typeCaption", { type: t(`accounting.type.${type}` as AppTranslationKey) })}</caption>
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {showCode && (
                <ResizableTableHead columnKey="code" width={getColumnWidth?.("code")} onResize={onColumnResize} className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("accounting.columns.account.code")}
                </ResizableTableHead>
              )}
              {showName && (
                <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("accounting.columns.account.name")}
                </ResizableTableHead>
              )}
              {showSubtype && (
                <ResizableTableHead columnKey="subtype" width={getColumnWidth?.("subtype")} onResize={onColumnResize} className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                  {t("accounting.columns.account.subtype")}
                </ResizableTableHead>
              )}
              {showDescription && (
                <ResizableTableHead columnKey="description" width={getColumnWidth?.("description")} onResize={onColumnResize} className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                  {t("accounting.columns.account.description")}
                </ResizableTableHead>
              )}
              {showNormalBalance && (
                <ResizableTableHead columnKey="normalBalance" width={getColumnWidth?.("normalBalance")} onResize={onColumnResize} className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">
                  {t("accounting.columns.account.normalBalance")}
                </ResizableTableHead>
              )}
              <th scope="col" className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">
                {t("accounting.columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accountTypeRows.map((account) => (
              <AccountTableRow
                key={account.id}
                account={account}
                balanceConfig={balanceConfig}
                canWrite={canWrite}
                showCode={showCode}
                showName={showName}
                showSubtype={showSubtype}
                showDescription={showDescription}
                showNormalBalance={showNormalBalance}
                onEdit={onEdit}
                onDelete={onDelete}
                onReactivate={onReactivate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
