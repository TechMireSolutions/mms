import { ListPagination } from "@/components/ui/ListPagination";
import { StudentListCards } from "@/tenant/features/students/components/StudentListCards";
import { StudentListTable } from "@/tenant/features/students/components/StudentListTable";
import type { StudentListContentProps } from "@/tenant/features/students/components/StudentListContentTypes";

export type {
  StudentListContentProps,
  StudentListMessagingRecipient,
  StudentListSession,
  StudentListSortField,
} from "@/tenant/features/students/components/StudentListContentTypes";

export function StudentListContent(props: StudentListContentProps) {
  if (props.layout === "cards") {
    return <StudentListCards {...props} />;
  }

  return (
    <StudentListTable
      {...props}
      footer={
        props.students.length > 0 && !props.hasServerPagination ? (
          <ListPagination
            page={props.currentPage}
            total={props.students.length}
            limit={props.pageSize}
            onPageChange={props.onPageChange}
            i18nNamespace="students"
            variant="range"
          />
        ) : undefined
      }
    />
  );
}
