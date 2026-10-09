import React from "react";
import { AlarmClock, Bell, CalendarRange, Download, Plus, Upload } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface FinancePageHeaderActionsProps {
  canWrite: boolean;
  canExport?: boolean;
  showDeleted: boolean;
  isExporting?: boolean;
  collectPending: boolean;
  remindPending: boolean;
  onCollectOverdue: () => void;
  onRemindInvoices: () => void;
  onGenerateInvoices: () => void;
  onCreateInvoice: () => void;
  onImport: () => void;
  onExport?: () => void;
}

export function FinancePageHeaderActions({
  canWrite,
  canExport = true,
  showDeleted,
  isExporting = false,
  collectPending,
  remindPending,
  onCollectOverdue,
  onRemindInvoices,
  onGenerateInvoices,
  onCreateInvoice,
  onImport,
  onExport,
}: FinancePageHeaderActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!canWrite || showDeleted) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canExport && onExport ? (
        <ActionButton
          variant="ghost"
          icon={Download}
          onClick={onExport}
          loading={isExporting}
          disabled={isExporting}
        >
          {t("common.export")}
        </ActionButton>
      ) : null}
      <ActionButton variant="secondary" icon={Upload} onClick={onImport}>
        {t("common.import")}
      </ActionButton>
      <ActionButton
        variant="secondary"
        icon={AlarmClock}
        loading={collectPending}
        onClick={onCollectOverdue}
      >
        {t("finance.collect.action")}
      </ActionButton>
      <ActionButton
        variant="secondary"
        icon={Bell}
        loading={remindPending}
        onClick={onRemindInvoices}
      >
        {t("finance.collect.remindAction")}
      </ActionButton>
      <ActionButton
        variant="secondary"
        icon={CalendarRange}
        onClick={onGenerateInvoices}
      >
        {t("finance.generate.action")}
      </ActionButton>
      <ActionButton variant="primary" icon={Plus} onClick={onCreateInvoice}>
        {t("finance.newInvoice")}
      </ActionButton>
    </div>
  );
}
