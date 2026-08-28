import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { KPISummary, ModuleReports } from "@/tenant/components/moduleReports";

export function StudentsReportsTier(): React.JSX.Element {
  return (
    <ModuleTierMotion tier="reports">
      <ErrorBoundary>
        <div className="space-y-4">
          <KPISummary category="students" />
          <ModuleReports category="students" />
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
}
