import { TeachersPageView } from "@/tenant/features/teachers/components/TeachersPageView";
import { useTeachersPageView } from "@/tenant/features/teachers/hooks/useTeachersPageView";

/**
 * Teachers — faculty roster and profiles. Standard 3-tier layout (Work | Reports | Setup).
 */
export default function Teachers(): React.JSX.Element {
  const view = useTeachersPageView();
  return <TeachersPageView {...view} />;
}
