import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";

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
