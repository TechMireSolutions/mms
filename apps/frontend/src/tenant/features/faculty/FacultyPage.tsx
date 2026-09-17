import React from "react";
import { FacultyPageView } from "@/tenant/features/faculty/components/FacultyPageView";
import { useFacultyPageController } from "@/tenant/features/faculty/hooks/useFacultyPageController";

/**
 * Faculty — faculty roster and profiles. Standard 3-tier layout (Work | Reports | Setup).
 */
export default function FacultyPage(): React.JSX.Element {
  const view = useFacultyPageController();
  return <FacultyPageView {...view} />;
}

export { FacultyPage, FacultyPage as TeachersPage };
