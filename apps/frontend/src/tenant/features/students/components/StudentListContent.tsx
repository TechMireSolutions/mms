import { WORK_SURFACE } from "@/components/ui/formStyles";
import { StudentListCards } from "@/tenant/features/students/components/StudentListCards";
import { StudentListDesktopTable } from "@/tenant/features/students/components/StudentListDesktopTable";
import type { StudentListContentProps } from "@/tenant/features/students/components/StudentListContentTypes";

/** Table/cards directory only — empty state mounts on StudentsWorkListBody (Contacts-shaped). */
export function StudentListContent(props: StudentListContentProps) {
  if (props.viewMode === "cards") {
    return <StudentListCards {...props} />;
  }

  return (
    <div className={`${WORK_SURFACE} overflow-hidden`}>
      <StudentListDesktopTable {...props} />
    </div>
  );
}
