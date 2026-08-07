import { StudentsPageView } from "@/tenant/features/students/components/StudentsPageView";
import { useStudentsPageView } from "@/tenant/features/students/hooks/useStudentsPageView";

/**
 * Students Directory and Records Page.
 * Implements the standard 3-tier tab system (Work | Reports | Setup).
 */
export default function Students() {
  const view = useStudentsPageView();
  return <StudentsPageView {...view} />;
}
