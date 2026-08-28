import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { KPISummary, ModuleReports } from "@/tenant/components/moduleReports";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";

export function ContactsReportsTier(): React.JSX.Element {
  return (
    <ModuleTierMotion tier="reports">
      <ErrorBoundary>
        <div className="space-y-4">
          <KPISummary category="contacts" />
          <ModuleReports category="contacts" />
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
}
