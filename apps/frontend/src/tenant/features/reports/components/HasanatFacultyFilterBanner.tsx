import { useTranslation } from "@/hooks/useTranslation";
import { ActiveFilterBanner } from "@/components/ui/ActiveFilterBanner";

interface HasanatFacultyFilterBannerProps {
  selectedFaculty: string | null;
  onClear: () => void;
}

export function HasanatFacultyFilterBanner({
  selectedFaculty,
  onClear,
}: HasanatFacultyFilterBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!selectedFaculty) return null;

  return (
    <ActiveFilterBanner
      chips={[{ key: "faculty", label: t("hasanat.report.facultyFilterLabel"), value: selectedFaculty }]}
      actions={[{ key: "faculty", label: t("hasanat.report.clearFacultyFilter"), onClick: onClear }]}
    />
  );
}
