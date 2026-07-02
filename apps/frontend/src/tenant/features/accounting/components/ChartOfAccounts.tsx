import React, { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Search, Download, EyeOff, Eye } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_META, Account, AccountType } from '@/lib/data/accountingData';
import { AccountModal } from "@/tenant/features/accounting/components/AccountModal";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

interface ChartOfAccountsProps {
  accounts: Account[];
  onChange: (accounts: Account[]) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
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
  isColumnVisible,
  columnCustomizer,
}: ChartOfAccountsProps) {
  const { t } = useTranslation();
  const [search,      setSearch]     = useState("");
  const [typeFilter,  setTypeFilter] = useState<AccountType | "all">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [modal,       setModal]      = useState<Partial<Account> | null>(null);

  const filtered = useMemo(() => accounts
    .filter((account) => typeFilter === "all" || account.type === typeFilter)
    .filter((account) => showInactive || account.isActive !== false)
    .filter((account) => !search || account.name.toLowerCase().includes(search.toLowerCase()) || account.code.includes(search))
    .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code)),
  [accounts, search, typeFilter, showInactive]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const showCode = isColumnVisible ? isColumnVisible("code") : true;
  const showName = isColumnVisible ? isColumnVisible("name") : true;
  const showSubtype = isColumnVisible ? isColumnVisible("subtype") : true;
  const showDescription = isColumnVisible ? isColumnVisible("description") : true;
  const showNormalBalance = isColumnVisible ? isColumnVisible("normalBalance") : true;

  const handleSave = (account: Account) => {
    if (account.id && accounts.find((existingAccount) => existingAccount.id === account.id)) onChange(accounts.map((existingAccount) => existingAccount.id === account.id ? account : existingAccount));
    else onChange([...accounts, { ...account, isActive: true }]);
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deactivate this account? It will be hidden but not erased.")) {
      onChange(accounts.map((account) => account.id === id ? { ...account, isActive: false } : account));
    }
  };

  const handleReactivate = (id: string) => onChange(accounts.map((account) => account.id === id ? { ...account, isActive: true } : account));

  const existingCodes = accounts.map((account) => account.code);

  const exportCSV = () => {
    runGridCsvExportJob({
      moduleId: "accounting",
      label: "Chart of accounts export",
      filename: "chart_of_accounts.csv",
      columns: [
        { header: "Code", key: "code" },
        { header: "Name", key: "name" },
        { header: "Type", key: "type" },
        { header: "Subtype", key: "subtype" },
        { header: "Normal Balance", key: "normalBalance" },
        { header: "Description", key: "description" },
        { header: "Active", key: "active" },
      ],
      rows: filtered.map((account) => ({
        code: account.code,
        name: account.name,
        type: account.type,
        subtype: account.subtype || "",
        normalBalance: ACCOUNT_TYPE_META[account.type]?.normalBalance || "",
        description: account.description || "",
        active: account.isActive !== false ? "Yes" : "No",
      })),
    });
  };

  return (
    <section aria-label="Chart of Accounts" className="space-y-4">
      {/* Toolbar */}
      <nav aria-label="Account controls" className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input 
            type="search"
            aria-label="Search accounts"
            value={search} 
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search accounts…"
            className="pl-9 pr-4" 
          />
        </div>
        <FormSelect 
          aria-label="Filter by account type"
          value={typeFilter} 
          onChange={(accountTypeValue) => setTypeFilter(accountTypeValue as AccountType | "all")}
          options={[{ value: "all", label: "All Types" }, ...ACCOUNT_TYPES]}
        />
        <Button 
          type="button"
          variant={showInactive ? "secondary" : "outline"}
          aria-pressed={showInactive}
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold"
        >
          {showInactive ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
          {showInactive ? "Showing All" : "Show Inactive"}
        </Button>
        <Button 
          type="button"
          variant="outline"
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export
        </Button>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
        <Button 
          type="button"
          variant="default"
          onClick={() => setModal({ id: "", code: "", name: "", type: "Asset", subtype: "", description: "", isActive: true })}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold ml-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Account
        </Button>
      </nav>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-2" aria-label="Account counts by type">
        {ACCOUNT_TYPES.map((type) => {
          const count = accounts.filter((account) => account.type === type && account.isActive !== false).length;
          if (count === 0) return null;
          return (
            <span key={type} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ACCOUNT_TYPE_META[type]?.color}`}>
              <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {type}: {count}
            </span>
          );
        })}
      </div>

      {/* Grouped by type */}
      {ACCOUNT_TYPES.map((type) => {
        const accountTypeRows = filtered.filter((account) => account.type === type);
        if (accountTypeRows.length === 0) return null;
        return (
          <article key={type} className="rounded-xl border border-border overflow-hidden">
            <header className={`px-4 py-2.5 border-b border-border ${ACCOUNT_TYPE_META[type]?.color} flex items-center justify-between`}>
              <h3 className="text-xs font-bold uppercase tracking-wide m-0">
                <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {type} Accounts — {ACCOUNT_TYPE_META[type]?.group}
              </h3>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Normal: {ACCOUNT_TYPE_META[type]?.normalBalance?.toUpperCase()} · {accountTypeRows.length} accounts
              </span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{type} Accounts</caption>
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {showCode && (
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase w-16">
                        {t("accounting.columns.account.code")}
                      </th>
                    )}
                    {showName && (
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("accounting.columns.account.name")}
                      </th>
                    )}
                    {showSubtype && (
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">
                        {t("accounting.columns.account.subtype")}
                      </th>
                    )}
                    {showDescription && (
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                        {t("accounting.columns.account.description")}
                      </th>
                    )}
                    {showNormalBalance && (
                      <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                        {t("accounting.columns.account.normalBalance")}
                      </th>
                    )}
                    <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("accounting.columns.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accountTypeRows.map((account) => (
                    <tr key={account.id} className={`hover:bg-muted/20 transition-colors ${account.isActive === false ? "opacity-50" : ""}`}>
                      {showCode && (
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-muted-foreground">{account.code}</td>
                      )}
                      {showName && (
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-foreground">{account.name}</span>
                          {account.isActive === false && <span className="ml-2 text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-full">Inactive</span>}
                        </td>
                      )}
                      {showSubtype && (
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{account.subtype || "—"}</td>
                      )}
                      {showDescription && (
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{account.description || "—"}</td>
                      )}
                      {showNormalBalance && (
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? "bg-info/15 text-info" : "bg-success/15 text-success"}`}>
                            {ACCOUNT_TYPE_META[account.type]?.normalBalance?.toUpperCase()}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${account.name}`}
                            onClick={() => setModal({ ...account })}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          {account.isActive === false ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Reactivate ${account.name}`}
                              onClick={() => handleReactivate(account.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-success"
                            >
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Deactivate ${account.name}`}
                              onClick={() => handleDelete(account.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}

      <p className="text-xs text-muted-foreground" aria-live="polite">{filtered.length} accounts shown</p>

      <AnimatePresence>
        {modal !== null && (
          <AccountModal initial={modal as Account} onSave={handleSave} onClose={() => setModal(null)} existingCodes={existingCodes} />
        )}
      </AnimatePresence>
    </section>
  );
}
