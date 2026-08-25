import { TeachersPageView } from "@/tenant/features/teachers/components/TeachersPageView";
import { useTeachersPageController } from "@/tenant/features/teachers/hooks/useTeachersPageController";

/**
 * Teachers — faculty roster and profiles. Standard 3-tier layout (Work | Reports | Setup).
 */
export default function TeachersPage(): React.JSX.Element {
  const view = useTeachersPageController();
  return <TeachersPageView {...view} />;
}
