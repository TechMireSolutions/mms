import type { ReactNode } from "react";
import { DETAIL_SECTION_TITLE } from "@/components/ui/formStyles";
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
  return <h4 className={cn(DETAIL_SECTION_TITLE, "ps-1", className)}>{children}</h4>;
}
