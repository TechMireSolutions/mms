import React, { useState, useMemo } from "react";
import { Plus, Pencil, Search, Download, EyeOff, Eye } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_META, Account, AccountType } from '@/lib/data/accountingData';
import AccountModal from "./AccountModal";

interface ChartOfAccountsProps {
  accounts: Account[];
  onChange: (accounts: Account[]) => void;
}

/**
 * ChartOfAccounts component.
 * 
 * Displays and manages the Chart of Accounts.
 * 
 * @param {ChartOfAccountsProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function ChartOfAccounts({ accounts, onChange }: ChartOfAccountsProps) {
  const [search,      setSearch]     = useState("");
  const [typeFilter,  setTypeFilter] = useState<AccountType | "all">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [modal,       setModal]      = useState<Partial<Account> | null>(null);

  const filtered = useMemo(() => accounts
    .filter((a) => typeFilter === "all" || a.type === typeFilter)
    .filter((a) => showInactive || a.isActive !== false)
    .filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search))
    .sort((a, b) => a.code.localeCompare(b.code)),
  [accounts, search, typeFilter, showInactive]);

  const handleSave = (acc: Account) => {
    if (acc.id && accounts.find((a) => a.id === acc.id)) onChange(accounts.map((a) => a.id === acc.id ? acc : a));
    else onChange([...accounts, { ...acc, isActive: true }]);
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deactivate this account? It will be hidden but not erased.")) {
      onChange(accounts.map((a) => a.id === id ? { ...a, isActive: false } : a));
    }
  };

  const handleReactivate = (id: string) => onChange(accounts.map((a) => a.id === id ? { ...a, isActive: true } : a));

  const existingCodes = accounts.map((a) => a.code);

  const exportCSV = () => {
    const rows = [["Code", "Name", "Type", "Subtype", "Normal Balance", "Description", "Active"]];
    filtered.forEach((a) => rows.push([a.code, a.name, a.type, a.subtype || "", ACCOUNT_TYPE_META[a.type]?.normalBalance || "", a.description || "", a.isActive !== false ? "Yes" : "No"]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    el.download = "chart_of_accounts.csv"; el.click();
  };

  return (
    <section aria-label="Chart of Accounts" className="space-y-4">
      {/* Toolbar */}
      <nav aria-label="Account controls" className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input 
            type="search"
            aria-label="Search accounts"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search accounts…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
          />
        </div>
        <select 
          aria-label="Filter by account type"
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value as AccountType | "all")}
          className="text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Types</option>
          {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button 
          type="button"
          aria-pressed={showInactive}
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${showInactive ? "bg-primary/10 border-primary/20 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
        >
          {showInactive ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
          {showInactive ? "Showing All" : "Show Inactive"}
        </button>
        <button 
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export
        </button>
        <button 
          type="button"
          onClick={() => setModal({ id: "", code: "", name: "", type: "Asset", subtype: "", description: "", isActive: true })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors ml-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Account
        </button>
      </nav>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-2" aria-label="Account counts by type">
        {ACCOUNT_TYPES.map((type) => {
          const count = accounts.filter((a) => a.type === type && a.isActive !== false).length;
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
        const group = filtered.filter((a) => a.type === type);
        if (group.length === 0) return null;
        return (
          <article key={type} className="rounded-xl border border-border overflow-hidden">
            <header className={`px-4 py-2.5 border-b border-border ${ACCOUNT_TYPE_META[type]?.color} flex items-center justify-between`}>
              <h3 className="text-xs font-bold uppercase tracking-wide m-0">
                <span aria-hidden="true">{ACCOUNT_TYPE_META[type]?.icon}</span> {type} Accounts — {ACCOUNT_TYPE_META[type]?.group}
              </h3>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Normal: {ACCOUNT_TYPE_META[type]?.normalBalance?.toUpperCase()} · {group.length} accounts
              </span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{type} Accounts</caption>
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase w-16">Code</th>
                    <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Name</th>
                    <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Subtype</th>
                    <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">Description</th>
                    <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Balance</th>
                    <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.map((a) => (
                    <tr key={a.id} className={`hover:bg-muted/20 transition-colors ${a.isActive === false ? "opacity-50" : ""}`}>
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-muted-foreground">{a.code}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-foreground">{a.name}</span>
                        {a.isActive === false && <span className="ml-2 text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-full">Inactive</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{a.subtype || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{a.description || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_META[a.type]?.normalBalance === "debit" ? "bg-info/15 text-info" : "bg-success/15 text-success"}`}>
                          {ACCOUNT_TYPE_META[a.type]?.normalBalance?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" aria-label={`Edit ${a.name}`} onClick={() => setModal({ ...a })} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          {a.isActive === false
                            ? <button type="button" aria-label={`Reactivate ${a.name}`} onClick={() => handleReactivate(a.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-success transition-colors"><Eye className="w-3.5 h-3.5" aria-hidden="true" /></button>
                            : <button type="button" aria-label={`Deactivate ${a.name}`} onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"><EyeOff className="w-3.5 h-3.5" aria-hidden="true" /></button>
                          }
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
