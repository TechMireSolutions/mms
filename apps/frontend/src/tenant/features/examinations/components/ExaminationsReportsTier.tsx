import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";

export function ExaminationsReportsTier() {
  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <KPISummary category="examinations" />
        <ModuleReports category="examinations" />
      </div>
    </ErrorBoundary>
  );
}
