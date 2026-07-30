export const TIMETABLE_TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  class:      { color: "bg-success/15 text-success border-success/30", dot: "bg-success" },
  lecture:    { color: "bg-info/15 text-info border-info/30",          dot: "bg-info" },
  assessment: { color: "bg-destructive/15 text-destructive border-destructive/30",             dot: "bg-destructive" },
  activity:   { color: "bg-primary/15 text-primary border-primary/30",    dot: "bg-primary" },
  spiritual:  { color: "bg-warning/15 text-warning border-warning/30",       dot: "bg-warning" },
  break:      { color: "bg-muted text-muted-foreground border-border",       dot: "bg-border" },
};

export const TIMETABLE_EMPTY_DRAFT = { day: "Mon", activity: "", startTime: "08:00", endTime: "09:00", location: "", type: "class" } as const;
