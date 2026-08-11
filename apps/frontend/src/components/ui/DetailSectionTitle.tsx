import type { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";

export interface DetailSectionTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight detail-drawer / profile section heading.
 * SSOT for the `DETAIL_SECTION_TITLE` header markup (Contacts / Students / Teachers).
 */
export function DetailSectionTitle({
  children,
  className,
}: DetailSectionTitleProps): React.JSX.Element {
  return <SectionLabel as="h4" className={cn("ps-1", className)}>{children}</SectionLabel>;
}
