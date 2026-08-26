import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/components/ui/reports/KPISummary";
import ModuleReports from "@/components/ui/reports/ModuleReports";

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
