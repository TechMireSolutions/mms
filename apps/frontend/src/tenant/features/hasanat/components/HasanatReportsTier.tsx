import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";

export function HasanatReportsTier() {
  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <KPISummary category="hasanat" />
        <ModuleReports category="hasanat" />
      </div>
    </ErrorBoundary>
  );
}
