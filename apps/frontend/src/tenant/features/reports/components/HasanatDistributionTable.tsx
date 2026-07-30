import React from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { HasanatReportItem } from "./HasanatReport";

interface HasanatDistributionTableProps {
  distribution: HasanatReportItem[];
  selectedFaculty: string | null;
  onToggleFacultyFilter: (faculty: string) => void;
}

export function HasanatDistributionTable({
  distribution,
  selectedFaculty,
  onToggleFacultyFilter,
}: HasanatDistributionTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const headers = [
    t("hasanat.report.colStudent"),
    t("hasanat.report.colClass"),
    t("hasanat.report.colFaculty"),
    t("hasanat.report.colDistributed"),
    t("hasanat.report.colRedeemed"),
    t("hasanat.report.colBalance"),
  ];

  return (
    <>
      <ExportToolbar title={t("hasanat.report.distributionTitle")} data={distribution} headers={headers} />
      {distribution.length === 0 ? (
        <EmptyState icon={Star} title={t("hasanat.report.noData")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {distribution.map((hasanatRow) => (
              <article
                key={hasanatRow.studentName}
                className={`space-y-3 rounded-xl border border-border bg-card p-3 ${selectedFaculty === hasanatRow.faculty ? "ring-1 ring-primary/20" : ""}`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h4 className="truncate text-sm font-semibold text-foreground">{hasanatRow.studentName}</h4>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${hasanatRow.balance > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                    {hasanatRow.balance}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colClass")}</dt>
                    <dd className="text-foreground">{hasanatRow.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colFaculty")}</dt>
                    <dd>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleFacultyFilter(hasanatRow.faculty)}
                        className={`h-auto min-h-11 px-0 py-0 font-normal hover:bg-transparent hover:text-foreground ${selectedFaculty === hasanatRow.faculty ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {hasanatRow.faculty}
                      </Button>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colDistributed")}</dt>
                    <dd className="font-semibold text-primary">{hasanatRow.distributed}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.report.colRedeemed")}</dt>
                    <dd className="font-semibold text-success">{hasanatRow.redeemed}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {headers.map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {headerLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {distribution.map((hasanatRow) => (
                  <tr key={hasanatRow.studentName} className={`hover:bg-muted/30 ${selectedFaculty === hasanatRow.faculty ? "bg-primary/10" : ""}`}>
                    <td className="px-3 py-2.5 font-medium">{hasanatRow.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{hasanatRow.class}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleFacultyFilter(hasanatRow.faculty)}
                        className={`h-auto px-0 py-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground ${
                          selectedFaculty === hasanatRow.faculty ? "text-primary" : ""
                        }`}
                      >
                        {hasanatRow.faculty}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-primary">{hasanatRow.distributed}</td>
                    <td className="px-3 py-2.5 font-semibold text-success">{hasanatRow.redeemed}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hasanatRow.balance > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                        {hasanatRow.balance}
                      </span>
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
