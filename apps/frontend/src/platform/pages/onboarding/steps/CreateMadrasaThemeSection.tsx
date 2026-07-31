import React from "react";
import { Building2, Palette, Wand2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import BrandColorPanel from "@/components/branding/BrandColorPanel";
import {
  FieldHint,
  FOOTER_MAX,
  defaultFooterForMadrasa,
} from "@/components/branding/BrandingShared";
import type { CreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";

interface CreateMadrasaThemeSectionProps {
  controller: CreateMadrasaController;
}

export function CreateMadrasaThemeSection({ controller }: CreateMadrasaThemeSectionProps): React.ReactElement {
  const { t, data, onChange, updateField, resolvedFooter } = controller;

  return (
    <>
      <SectionCard
        title={t("theme.coloursTitle")}
        subtitle={t("theme.coloursSubtitle")}
        icon={Palette}
      >
        <BrandColorPanel
          primaryColor={data.primaryColor}
          secondaryColor={data.secondaryColor}
          previewMode="light"
          onPrimaryChange={(hex) => updateField("primaryColor", hex)}
          onSecondaryChange={(hex) => updateField("secondaryColor", hex)}
          onApplyPreset={(primary, secondary) => {
            onChange((prev) => ({
              ...prev,
              primaryColor: primary,
              secondaryColor: secondary,
            }));
          }}
        />
      </SectionCard>

      <SectionCard
        title={t("theme.footerTitle")}
        subtitle={t("theme.footerSubtitle")}
        icon={Building2}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("footerText", defaultFooterForMadrasa(data.name, "en"))}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {t("theme.footerGenerate")}
          </Button>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="onboarding-footer">{t("theme.footerLabel")}</Label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {data.footerText.length}/{FOOTER_MAX}
            </span>
          </div>
          <Textarea
            id="onboarding-footer"
            value={data.footerText}
            maxLength={FOOTER_MAX}
            rows={2}
            placeholder={defaultFooterForMadrasa(data.name, "en")}
            aria-describedby="onboarding-footer-hint"
            onChange={(event) => updateField("footerText", event.target.value)}
          />
          <FieldHint id="onboarding-footer-hint">{t("theme.footerHint")}</FieldHint>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">{t("theme.footerPreviewLabel")}</p>
          <p className="mt-1 text-xs text-foreground">{resolvedFooter}</p>
        </div>
      </SectionCard>
    </>
  );
}
