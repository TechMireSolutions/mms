import { createModuleWorkDrillDown } from "@/lib/query/createModuleWorkDrillDown";
import type { TeachersQuickFilter } from "@mms/shared";

export const TEACHERS_WORK_DRILLDOWN_EVENT = "teachers-work-drilldown";

export interface TeachersWorkDrillDown {
  /** Work quick-filter preset (e.g. active, onLeave). */
  quickFilter?: TeachersQuickFilter;
}

const { apply, consume } = createModuleWorkDrillDown<TeachersWorkDrillDown>({
  event: TEACHERS_WORK_DRILLDOWN_EVENT,
  storageKey: "mms_teachers_work_drilldown",
});

export function applyTeachersWorkDrillDown(filter: TeachersWorkDrillDown): void {
  apply(filter);
}

export function consumeTeachersWorkDrillDown(): TeachersWorkDrillDown | null {
  return consume();
}
