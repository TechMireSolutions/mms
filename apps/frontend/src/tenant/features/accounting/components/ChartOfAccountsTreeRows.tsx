import React from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ACCOUNT_TYPE_META, type Account } from "@/lib/data/accountingData";

interface AccountRowActionsProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
}

function AccountRowActions({ account, onEdit, onDelete, onReactivate }: AccountRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("accounting.coa.editAria", { name: account.name })}
        onClick={() => onEdit(account)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      {account.isActive === false ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("accounting.coa.reactivateAria", { name: account.name })}
          onClick={() => onReactivate(account.id)}
          className="text-muted-foreground hover:text-success"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("accounting.coa.deactivateAria", { name: account.name })}
          onClick={() => onDelete(account.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </>
  );
}

export interface AccountRecordProps {
  account: Account;
  balanceConfig: Record<string, StatusBadgeConfigItem>;
  canWrite: boolean;
  isColumnVisible: (key: string) => boolean;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
}

export function AccountMobileCard({
  account,
  balanceConfig,
  canWrite,
  isColumnVisible,
  onEdit,
  onDelete,
  onReactivate,
}: AccountRecordProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <article className={`space-y-3 rounded-xl border border-border bg-card p-3 ${account.isActive === false ? "opacity-50" : ""}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isColumnVisible("code") && <p className="m-0 font-mono text-xs font-bold text-muted-foreground">{account.code}</p>}
          {isColumnVisible("name") && (
            <h4 className="m-0 mt-0.5 text-sm font-semibold text-foreground">
              {account.name}
              {account.isActive === false && <span className="ms-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">{t("accounting.coa.inactive")}</span>}
            </h4>
          )}
        </div>
        {isColumnVisible("normalBalance") && (
          <StatusBadge
            status={ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? "debit" : "credit"}
            config={balanceConfig}
            size="sm"
          />
        )}
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {isColumnVisible("subtype") && (
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.account.subtype")}</dt>
            <dd className="text-foreground">{account.subtype || "—"}</dd>
          </div>
        )}
        {isColumnVisible("description") && (
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">{t("accounting.columns.account.description")}</dt>
            <dd className="break-words text-foreground">{account.description || "—"}</dd>
          </div>
        )}
      </dl>
      {canWrite && (
        <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
          <AccountRowActions account={account} onEdit={onEdit} onDelete={onDelete} onReactivate={onReactivate} />
        </div>
      )}
    </article>
  );
}

export function AccountTableRow({
  account,
  balanceConfig,
  canWrite,
  isColumnVisible,
  onEdit,
  onDelete,
  onReactivate,
}: AccountRecordProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <tr className={`transition-colors hover:bg-muted/20 ${account.isActive === false ? "opacity-50" : ""}`}>
      {isColumnVisible("code") && <td className="px-4 py-2.5 font-mono text-xs font-bold text-muted-foreground">{account.code}</td>}
      {isColumnVisible("name") && (
        <td className="px-4 py-2.5">
          <span className="font-semibold text-foreground">{account.name}</span>
          {account.isActive === false && <span className="ms-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">{t("accounting.coa.inactive")}</span>}
        </td>
      )}
      {isColumnVisible("subtype") && <td className="hidden px-4 py-2.5 text-xs text-muted-foreground md:table-cell">{account.subtype || "—"}</td>}
      {isColumnVisible("description") && <td className="hidden max-w-[12.5rem] truncate px-4 py-2.5 text-xs text-muted-foreground lg:table-cell">{account.description || "—"}</td>}
      {isColumnVisible("normalBalance") && (
        <td className="px-4 py-2.5">
          <StatusBadge
            status={ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? "debit" : "credit"}
            config={balanceConfig}
            size="sm"
          />
        </td>
      )}
      <td className="px-4 py-2.5 text-end">
        <div className="flex items-center justify-end gap-1">
          {canWrite && <AccountRowActions account={account} onEdit={onEdit} onDelete={onDelete} onReactivate={onReactivate} />}
        </div>
      </td>
    </tr>
  );
}
