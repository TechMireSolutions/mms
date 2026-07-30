import { TooltipContentProps, TooltipPayloadEntry } from "recharts";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";

export function RevenueChartTooltip({ active = false, payload = [], label = "" }: Partial<TooltipContentProps>) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-glass rounded-xl px-4 py-3 shadow-lg text-xs space-y-1.5 text-start select-none">
      <p className="text-muted-foreground/80 text-xs font-bold m-0">{label}</p>
      {payload.map((payloadEntry: TooltipPayloadEntry) => (
        <div key={payloadEntry.dataKey as string | number} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: payloadEntry.color }} aria-hidden="true" />
          <span className="text-muted-foreground/85 text-xs capitalize">
            {payloadEntry.dataKey === "revenue"
              ? t("accounting.dashboard.revenue")
              : t("accounting.dashboard.expenses")}
          </span>
          <span className="font-bold text-foreground ms-auto tabular-nums">
            {formatCurrency(Number(payloadEntry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}
