import React from "react";

interface GrBadgeProps {
  grNumber: string | null | undefined;
  className?: string;
}

/** GR number pill badge — shared across StudentDetail, StudentList, and StudentForm. */
export function GrBadge({ grNumber, className }: GrBadgeProps): React.JSX.Element | null {
  if (!grNumber) return null;
  return (
    <span
      className={`bg-primary/5 text-primary text-[9px] px-1.5 py-0.5 rounded border border-primary/10 font-bold uppercase tracking-wider ${className ?? ""}`}
    >
      GR: {grNumber}
    </span>
  );
}
