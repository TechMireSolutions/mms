import React, { useMemo } from "react";
import { type AppTranslationKey } from "@mms/shared";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { Badge } from "@/components/ui/badge";
import { type StatusBadgeConfigItem, StatusBadge } from "@/components/ui/StatusBadge";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work/WorkBatchTable";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_META, type Account, type AccountType } from "@/lib/data/accountingData";
import { AccountMobileCard, AccountRowActions } from "@/tenant/features/accounting/components/ChartOfAccountsTreeRows";

interface ChartOfAccountsListDesktopTableProps {
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
  viewMode?: WorkDirectoryViewMode;
}

export function ChartOfAccountsListDesktopTable({
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
  viewMode,
}: ChartOfAccountsListDesktopTableProps): React.JSX.Element {
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
            viewMode={viewMode}
          />
        );
      })}
    </>
  );
}

interface AccountTypeGroupProps extends Omit<ChartOfAccountsListDesktopTableProps, "accounts" | "filteredAccounts"> {
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
  viewMode: propViewMode,
}: AccountTypeGroupProps): React.JSX.Element {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
  
  const batchColumns = useMemo<WorkBatchTableColumn<Account>[]>(() => {
    const cols: WorkBatchTableColumn<Account>[] = [];
    
    if (isColumnVisible("code")) {
      cols.push({
        id: "code",
        label: t("accounting.columns.account.code"),
        width: getColumnWidth?.("code"),
        cellClassName: "font-mono text-xs font-bold text-muted-foreground",
        render: (account) => account.code,
      });
    }
    
    if (isColumnVisible("name")) {
      cols.push({
        id: "name",
        label: t("accounting.columns.account.name"),
        width: getColumnWidth?.("name"),
        render: (account) => (
          <>
            <span className="font-semibold text-foreground">{account.name}</span>
            {account.isActive === false && <Badge as="span" pill tone="muted" className="ms-2 px-1.5">{t("accounting.coa.inactive")}</Badge>}
          </>
        ),
      });
    }
    
    if (isColumnVisible("subtype")) {
      cols.push({
        id: "subtype",
        label: t("accounting.columns.account.subtype"),
        width: getColumnWidth?.("subtype"),
        headerClassName: "hidden md:table-cell",
        cellClassName: "hidden text-xs text-muted-foreground md:table-cell",
        render: (account) => account.subtype || "—",
      });
    }
    
    if (isColumnVisible("description")) {
      cols.push({
        id: "description",
        label: t("accounting.columns.account.description"),
        width: getColumnWidth?.("description"),
        headerClassName: "hidden lg:table-cell",
        cellClassName: "hidden max-w-cell-trunc truncate text-xs text-muted-foreground lg:table-cell",
        render: (account) => account.description || "—",
      });
    }
    
    if (isColumnVisible("normalBalance")) {
      cols.push({
        id: "normalBalance",
        label: t("accounting.columns.account.normalBalance"),
        width: getColumnWidth?.("normalBalance"),
        render: (account) => (
          <StatusBadge
            status={ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? "debit" : "credit"}
            config={balanceConfig}
            size="sm"
          />
        ),
      });
    }
    
    return cols;
  }, [isColumnVisible, t, getColumnWidth, balanceConfig]);

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
      {viewMode === "cards" ? (
        <div className="p-3">
          <DirectoryCardsGrid>
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
          </DirectoryCardsGrid>
        </div>
      ) : (
        <WorkBatchTable
          data={accountTypeRows}
          columns={batchColumns}
          columnResize={{
            getColumnWidth,
            onColumnResize,
          }}
          actionsLabel={t("accounting.columns.actions")}
          rowClassName={(account) => account.isActive === false ? "opacity-50" : ""}
          renderRowActions={(account) => (
            <div className="flex items-center justify-end gap-1">
              {canWrite && <AccountRowActions account={account} onEdit={onEdit} onDelete={onDelete} onReactivate={onReactivate} />}
            </div>
          )}
        />
      )}
    </article>
  );
}
