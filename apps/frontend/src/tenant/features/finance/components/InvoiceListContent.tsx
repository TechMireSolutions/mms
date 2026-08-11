import type React from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvoiceListCards } from "@/tenant/features/finance/components/InvoiceListCards";
import { InvoiceListTable } from "@/tenant/features/finance/components/InvoiceListTable";
import type { InvoiceListContentProps } from "@/tenant/features/finance/components/invoiceListContentShared";
import { ReceiptText } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function InvoiceListContent(props: InvoiceListContentProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {props.invoices.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={ReceiptText}
          title={t("finance.empty.invoicesTitle")}
          description={t("finance.empty.invoicesSubtitle")}
          compact
        />
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden">
          {props.viewMode === "cards" ? <InvoiceListCards {...props} /> : <InvoiceListTable {...props} />}
        </Card>
      )}
    </>
  );
}
