import { useState } from "react";
import { MEDIA_MD_UP } from "@/lib/breakpoints";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Work directory layout: table on desktop, cards on small screens. */
export type WorkDirectoryViewMode = "table" | "cards";

/**
 * Single resolved Work directory view mode.
 * Default: cards below md, table at md+. Explicit setViewMode overrides until changed.
 */
export function useWorkDirectoryViewMode(): {
  viewMode: WorkDirectoryViewMode;
  setViewMode: (mode: WorkDirectoryViewMode) => void;
} {
  const isMdUp = useMediaQuery(MEDIA_MD_UP);
  const [override, setOverride] = useState<WorkDirectoryViewMode | null>(null);
  const viewMode: WorkDirectoryViewMode = override ?? (isMdUp ? "table" : "cards");
  return { viewMode, setViewMode: setOverride };
}
