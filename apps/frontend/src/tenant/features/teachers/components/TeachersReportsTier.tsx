import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import KPISummary from "@/components/ui/reports/KPISummary";
import ModuleReports from "@/components/ui/reports/ModuleReports";

export function TeachersReportsTier(): React.JSX.Element {
  return (
    <ModuleTierMotion tier="reports">
      <ErrorBoundary>
        <div className="space-y-4">
          <KPISummary category="teachers" />
          <ModuleReports category="teachers" />
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
}
