import type React from "react";
import { Card } from "@/components/ui/card";
import { InvoiceListCards } from "@/tenant/features/finance/components/InvoiceListCards";
import { InvoiceListTable } from "@/tenant/features/finance/components/InvoiceListTable";
import type { InvoiceListContentProps } from "@/tenant/features/finance/components/invoiceListContentShared";

export type { InvoiceListVisibleColumns } from "@/tenant/features/finance/components/invoiceListContentShared";

export function InvoiceListContent(props: InvoiceListContentProps): React.JSX.Element {
  return (
    <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
      {props.viewMode === "cards" ? <InvoiceListCards {...props} /> : <InvoiceListTable {...props} />}
    </Card>
  );
}
