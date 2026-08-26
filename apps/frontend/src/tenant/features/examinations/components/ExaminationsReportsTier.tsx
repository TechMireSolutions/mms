import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/components/ui/reports/KPISummary";
import ModuleReports from "@/components/ui/reports/ModuleReports";

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
