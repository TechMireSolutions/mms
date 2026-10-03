/**
 * @file StructureStep.tsx
 * @description Onboarding step 3 — apply recommended blueprint or start blank.
 */

import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { Building2, Check } from "lucide-react";
import {
  findBlueprintById,
  getRecommendedBlueprintForIndustry,
} from "@mms/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { OnboardingData } from "@/platform/pages/onboarding/onboardingWizardTypes";

interface StructureStepProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

export default function StructureStep({
  data,
  onChange,
}: StructureStepProps): React.JSX.Element {
  const { t } = useTranslation();
  const recommendedId = getRecommendedBlueprintForIndustry(data.industryType);
  const blueprint = findBlueprintById(
    data.applyRecommendedStructure ? data.blueprintId || recommendedId : recommendedId,
  );

  const selectRecommended = () => {
    onChange((prev) => ({
      ...prev,
      applyRecommendedStructure: true,
      blueprintId: getRecommendedBlueprintForIndustry(prev.industryType),
    }));
  };

  const selectBlank = () => {
    onChange((prev) => ({
      ...prev,
      applyRecommendedStructure: false,
      blueprintId: "",
    }));
  };

  return (
    <SectionCard
      title={t("onboarding.structureTitle")}
      subtitle={t("onboarding.structureSubtitle")}
      icon={Building2}
    >
      <div className="space-y-4">
        <div role="radiogroup" aria-label={t("onboarding.structureTitle")} className="grid gap-2.5">
          <StructureChoice
            selected={data.applyRecommendedStructure}
            title={t("onboarding.structureApplyRecommended")}
            description={t("onboarding.structureApplyRecommendedDesc")}
            onSelect={selectRecommended}
          />
          <StructureChoice
            selected={!data.applyRecommendedStructure}
            title={t("onboarding.structureStartBlank")}
            description={t("onboarding.structureStartBlankDesc")}
            onSelect={selectBlank}
          />
        </div>

        {data.applyRecommendedStructure && blueprint ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1.5">
            <p className="font-medium text-foreground">{blueprint.name}</p>
            <p className="text-muted-foreground">{blueprint.description}</p>
            <p className="text-muted-foreground">
              {t("onboarding.structurePreviewCounts", {
                positions: blueprint.positions.length,
                departments: blueprint.departments.length,
                locations: blueprint.locations.length,
              })}
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function StructureChoice({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <div
      role="radio"
      tabIndex={0}
      aria-checked={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`min-h-11 w-full text-start rounded-lg border p-3 cursor-pointer transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {selected ? <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> : null}
      </div>
    </div>
  );
}
