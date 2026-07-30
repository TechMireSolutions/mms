import { CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { utilisationColour } from "./sessionReportUtils";

import type { SessionReportTableProps } from "./sessionReportTypes";

function UtilisationBar({ rate }: { rate: number }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full ${utilisationColour(rate)}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-bold text-foreground">{rate}%</span>
    </div>
  );
}

export function SessionReportTable({
  sessionCapacityData,
  sessionStatusConfig,
  onToggleSessionFilter,
  onToggleClassFilter,
}: SessionReportTableProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ExportToolbar
        title={t("sessions.report.capacityReportTitle")}
        data={sessionCapacityData}
        headers={[
          t("sessions.report.colSession"),
          t("sessions.report.colClass"),
          t("sessions.report.colEnrolled"),
          t("sessions.report.colCapacity"),
          t("sessions.report.colUtilisation"),
          t("sessions.report.colStatus"),
        ]}
      />
      {sessionCapacityData.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t("sessions.report.noData")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {sessionCapacityData.map((sessionCapacity) => (
              <article
                key={`${sessionCapacity.sessionId}-${sessionCapacity.classId}`}
                className="space-y-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onToggleSessionFilter(sessionCapacity.session)}
                      className="h-auto min-h-11 max-w-full truncate px-0 py-0 text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {sessionCapacity.session}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onToggleClassFilter(sessionCapacity.class)}
                      className="h-auto min-h-11 px-0 py-0 text-xs font-normal text-muted-foreground hover:text-primary"
                    >
                      {sessionCapacity.class}
                    </Button>
                  </div>
                  <StatusBadge status={sessionCapacity.status} config={sessionStatusConfig} size="sm" />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.report.colEnrolled")}</dt>
                    <dd className="font-semibold text-foreground">{sessionCapacity.enrolled}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.report.colCapacity")}</dt>
                    <dd className="text-muted-foreground">{sessionCapacity.capacity}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("sessions.report.colUtilisation")}</dt>
                    <dd>
                      <UtilisationBar rate={sessionCapacity.rate} />
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {[t("sessions.report.colSession"), t("sessions.report.colClass"), t("sessions.report.colEnrolled"), t("sessions.report.colCapacity"), t("sessions.report.colUtilisation"), t("sessions.report.colStatus")].map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{headerLabel}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionCapacityData.map((sessionCapacity) => (
                  <tr key={`${sessionCapacity.sessionId}-${sessionCapacity.classId}`} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium max-w-[11.25rem] truncate">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleSessionFilter(sessionCapacity.session)}
                        className="h-auto px-0 py-0 max-w-[11.25rem] truncate font-medium text-foreground hover:text-primary"
                      >
                        {sessionCapacity.session}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleClassFilter(sessionCapacity.class)}
                        className="h-auto px-0 py-0 font-normal text-muted-foreground hover:text-primary"
                      >
                        {sessionCapacity.class}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-foreground">{sessionCapacity.enrolled}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{sessionCapacity.capacity}</td>
                    <td className="px-3 py-2.5 w-36">
                      <UtilisationBar rate={sessionCapacity.rate} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={sessionCapacity.status} config={sessionStatusConfig} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
