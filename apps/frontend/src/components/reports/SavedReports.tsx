import React, { useMemo } from "react";
import { Bookmark, Trash2, Play, Plus, Clock, User } from "lucide-react";
import { saveCollection } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import EmptyState from "../ui/EmptyState";

export interface SavedReportItem {
  id: string;
  name: string;
  category: string;
  lastRun: string;
  createdBy: string;
}

const SAVED_REPORTS: SavedReportItem[] = [
  { id: "sr1", name: "Monthly Fee Collection", category: "financial", lastRun: "2 hours ago", createdBy: "Admin" },
  { id: "sr2", name: "Weekly Attendance Lows", category: "attendance", lastRun: "1 day ago", createdBy: "Admin" },
  { id: "sr3", name: "Hifz Top Performers", category: "academic", lastRun: "5 days ago", createdBy: "Teacher" },
  { id: "sr4", name: "Inactive Students Follow-up", category: "students", lastRun: "1 week ago", createdBy: "Admin" },
];

const CATEGORY_COLOR: Record<string, string> = {
  financial:  "bg-success/10 text-success",
  students:   "bg-info/10 text-info",
  contacts:   "bg-primary/10 text-primary",
  attendance: "bg-warning/10 text-warning",
  academic:   "bg-primary/10 text-primary",
  hasanat:    "bg-primary/10 text-primary",
  sessions:   "bg-info/10 text-info",
  faculty:    "bg-secondary/10 text-secondary",
};

interface SavedReportsProps {
  category: string;
}

/**
 * Renders the saved and scheduled report templates.
 * Filtered by module category.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function SavedReports({ category }: SavedReportsProps): React.JSX.Element {
  const allSaved = useLiveCollection<SavedReportItem>("reports_saved_reports", SAVED_REPORTS);

  const saved = useMemo(() => {
    return allSaved.filter(r => r.category === category || r.category === "students");
  }, [allSaved, category]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-sm font-semibold text-foreground">Saved Report Templates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Save filter configurations as reusable report templates.</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          type="button"
        >
          <Plus className="w-3.5 h-3.5" />
          Save Current Filters
        </button>
      </div>

      {saved.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved reports" description="Configure filters and save them as a template." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {saved.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm flex flex-col gap-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{r.name}</h4>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${CATEGORY_COLOR[r.category] || "bg-muted text-muted-foreground"}`}>
                    {r.category}
                  </span>
                </div>
                <Bookmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.lastRun}</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.createdBy}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline" type="button">
                  <Play className="w-3 h-3" /> Run
                </button>
                <button
                  onClick={() => saveCollection("reports_saved_reports", allSaved.filter((x) => x.id !== r.id))}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors ml-auto"
                  type="button"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled reports */}
      <div className="mt-6 text-left">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Scheduled Reports</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-card/50 backdrop-blur-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" type="button">
            <Plus className="w-3.5 h-3.5" />
            Schedule
          </button>
        </div>
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/20 backdrop-blur-sm p-6 text-center">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h4 className="text-sm font-medium text-foreground">No scheduled reports</h4>
          <p className="text-xs text-muted-foreground mt-1">Schedule reports to be emailed automatically (daily, weekly, monthly).</p>
          <button className="mt-3 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors" type="button">
            Set up a schedule
          </button>
        </div>
      </div>
    </div>
  );
}
