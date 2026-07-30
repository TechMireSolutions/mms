import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { toTitleCase } from "@mms/shared";

import type { StudentReportTablesProps } from "./studentReportTypes";

export function StudentReportTables({
  activeSubTab,
  students,
  enrollments,
  statusBadgeConfig,
  enrollmentStatusConfig,
}: StudentReportTablesProps): React.JSX.Element {
  const { t } = useTranslation();

  if (activeSubTab === "list") {
    return students.length === 0 ? (
      <EmptyState icon={Users} title={t("students.report.noStudentsFound")} description={t("students.report.adjustFilters")} compact />
    ) : (
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="space-y-3 p-3 md:hidden">
          {students.map((student) => (
            <article key={student.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <h4 className="truncate text-sm font-semibold text-foreground">{student.name}</h4>
                <StatusBadge status={student.status} config={statusBadgeConfig} />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colGender")}</dt>
                  <dd className="text-foreground">{toTitleCase(student.gender)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colClass")}</dt>
                  <dd className="truncate text-foreground">{student.class}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colSession")}</dt>
                  <dd className="truncate text-foreground">{student.session}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colCity")}</dt>
                  <dd className="truncate text-foreground">{student.city}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colAge")}</dt>
                  <dd className="text-foreground">{student.age}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colRegistered")}</dt>
                  <dd className="text-muted-foreground">{student.registered}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("students.report.colName")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("students.report.colGender")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("students.report.colClass")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("students.report.colSession")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("students.report.colCity")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("students.report.colAge")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("students.report.colRegistered")}</th>
                <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("students.report.colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-foreground">{student.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{toTitleCase(student.gender)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{student.class}</td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[10rem] truncate hidden md:table-cell">{student.session}</td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{student.city}</td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{student.age}</td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{student.registered}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={student.status} config={statusBadgeConfig} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return enrollments.length === 0 ? (
    <EmptyState icon={Users} title={t("students.report.noEnrollmentsFound")} compact />
  ) : (
    <Card className="overflow-hidden mt-4">
      <div className="space-y-3 p-3 md:hidden">
        {enrollments.map((enrollment) => (
          <article key={enrollment.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h4 className="truncate text-sm font-semibold text-foreground">{enrollment.studentName}</h4>
              <StatusBadge status={enrollment.status} config={enrollmentStatusConfig} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colSession")}</dt>
                <dd className="text-foreground">{enrollment.session}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colClass")}</dt>
                <dd className="text-foreground">{enrollment.class}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-muted-foreground">{t("students.report.colEnrolled")}</dt>
                <dd className="text-muted-foreground">{enrollment.enrolled}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border/50">
            <tr>
              {[t("students.report.colStudent"), t("students.report.colSession"), t("students.report.colClass"), t("students.report.colEnrolled"), t("students.report.colStatus")].map((headerLabel) => (
                <th key={headerLabel} className="px-4 py-3 text-start text-xs font-black text-muted-foreground uppercase tracking-widest">{headerLabel}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-medium text-foreground">{enrollment.studentName}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{enrollment.session}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{enrollment.class}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{enrollment.enrolled}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={enrollment.status} config={enrollmentStatusConfig} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
