import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { KPISummary, ModuleReports } from "@/tenant/components/moduleReports";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";

export function ContactsReportsTier(): React.JSX.Element {
  return (
    <ModuleTierMotion tier="reports" className="space-y-4">
      <ErrorBoundary>
        <KPISummary category="contacts" />
        <ModuleReports category="contacts" />
      </ErrorBoundary>
    </ModuleTierMotion>
  );
}
