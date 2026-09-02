import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ACCOUNT_TYPE_META, type Account, type AccountType } from '@/lib/data/accountingData';
import { AccountModal } from "@/tenant/features/accounting/components/AccountModal";
import { ChartOfAccountsListFilters } from "@/tenant/features/accounting/components/ChartOfAccountsListFilters";
import { ChartOfAccountsListDesktopTable } from "@/tenant/features/accounting/components/ChartOfAccountsListDesktopTable";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { useTranslation } from "@/hooks/useTranslation";
import { type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { type AppTranslationKey } from "@mms/shared";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';

interface ChartOfAccountsProps {
  accounts: Account[];
  onChange: (accounts: Account[] | ((prev: Account[]) => Account[])) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

/**
 * ChartOfAccounts component.
 * 
 * Displays and manages the Chart of Accounts.
 * 
 * @param {ChartOfAccountsProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function ChartOfAccounts({
  accounts,
  onChange,
  onFilteredCountChange,
  canWrite = true,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: ChartOfAccountsProps) {
  const { t } = useTranslation();
  const [search,      setSearch]     = useState("");
  const [typeFilter,  setTypeFilter] = useState<AccountType | "all">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [modal,       setModal]      = useState<Partial<Account> | null>(null);
  const balanceConfig = (() => ({
    debit: { label: t("accounting.ledger.dr"), cls: SEMANTIC_BADGE.infoStrong },
    credit: { label: t("accounting.ledger.cr"), cls: SEMANTIC_BADGE.successStrong },
  }))() as Record<string, StatusBadgeConfigItem>;

  const filtered = (() => accounts
    .filter((account) => typeFilter === "all" || account.type === typeFilter)
    .filter((account) => showInactive || account.isActive !== false)
    .filter((account) => !search || account.name.toLowerCase().includes(search.toLowerCase()) || account.code.includes(search))
    .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code)))();

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const handleSave = async (account: Account) => {
    await onChange((prev) => {
      if (account.id && prev.find((existingAccount) => existingAccount.id === account.id)) {
        return prev.map((existingAccount) => existingAccount.id === account.id ? account : existingAccount);
      }
      return [...prev, { ...account, isActive: true }];
    });
    setModal(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("accounting.coa.deactivateConfirm"))) return;
    await onChange((prev) => prev.map((account) => account.id === id ? { ...account, isActive: false } : account));
  };

  const handleReactivate = async (id: string) => {
    await onChange((prev) => prev.map((account) => account.id === id ? { ...account, isActive: true } : account));
  };

  const existingCodes = accounts.map((account) => account.code);

  const exportCSV = () => {
    runGridCsvExportJob({
      moduleId: "accounting",
      label: t("accounting.coa.exportLabel"),
      filename: "chart_of_accounts.csv",
      columns: [
        { header: t("accounting.columns.account.code"), key: "code" },
        { header: t("accounting.columns.account.name"), key: "name" },
        { header: t("accounting.columns.account.type"), key: "type" },
        { header: t("accounting.columns.account.subtype"), key: "subtype" },
        { header: t("accounting.columns.account.normalBalance"), key: "normalBalance" },
        { header: t("accounting.columns.account.description"), key: "description" },
        { header: t("accounting.columns.account.active"), key: "active" },
      ],
      rows: filtered.map((account) => ({
        code: account.code,
        name: account.name,
        type: t(`accounting.type.${account.type}` as AppTranslationKey),
        subtype: account.subtype || "",
        normalBalance: ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? t("accounting.ledger.dr") : t("accounting.ledger.cr"),
        description: account.description || "",
        active: account.isActive !== false ? t("common.yes") : t("common.no"),
      })),
    });
  };

  return (
    <section aria-label={t("accounting.coa.aria")} className="space-y-4">
      <ChartOfAccountsListFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
        onExportCsv={exportCSV}
        onAddAccount={() => setModal({ id: "", code: "", name: "", type: "Asset", subtype: "", description: "", isActive: true })}
        canWrite={canWrite}
        columnCustomizer={columnCustomizer}
      />

      <ChartOfAccountsListDesktopTable
        accounts={accounts}
        filteredAccounts={filtered}
        balanceConfig={balanceConfig}
        canWrite={canWrite}
        isColumnVisible={columnVisible}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onEdit={(account) => setModal({ ...account })}
        onDelete={handleDelete}
        onReactivate={handleReactivate}
      />

      <p className="text-xs text-muted-foreground" aria-live="polite">{t("accounting.coa.accountsShown", { count: filtered.length })}</p>

      <AnimatePresence>
        {canWrite && modal !== null && (
          <AccountModal initial={modal as Account} onSave={handleSave} onClose={() => setModal(null)} existingCodes={existingCodes} />
        )}
      </AnimatePresence>
    </section>
  );
}
