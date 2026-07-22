import React, { useMemo, useEffect } from "react";
import { Globe, Check, Building2, Palette, Type, Wand2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import {
  DEFAULT_BRANDING_SETTINGS,
  mergeBrandingSettings,
  slugifySubdomain,
} from "@mms/shared";
import { applyBrandingTheme } from "@/lib/brandingTheme";
import { getAppDomain } from "@/lib/config/tenantConfig";
import { useTranslation } from "@/hooks/useTranslation";
import { SectionCard } from "@/components/ui/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import BrandColorPanel from "@/tenant/features/settings/components/branding/BrandColorPanel";
import BrandingIdentityPreview from "@/tenant/features/settings/components/branding/BrandingIdentityPreview";
import {
  FieldHint,
  FOOTER_MAX,
  ImageUploadField,
  NAME_MAX,
  TAGLINE_MAX,
  defaultFooterForMadrasa,
} from "@/tenant/features/settings/components/branding/BrandingShared";

interface CreateMadrasaProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * Institution identity + theme — mirrors Settings → Institution and Settings → Theme.
 */
export default function CreateMadrasa({ data, onChange }: CreateMadrasaProps): React.ReactElement {
  const { t, language } = useTranslation();
  const appDomain = getAppDomain();

  const updateField = <K extends keyof OnboardingData>(field: K, fieldValue: OnboardingData[K]) => {
    onChange((prev) => ({ ...prev, [field]: fieldValue }));
  };

  const previewBranding = useMemo(
    () =>
      mergeBrandingSettings({
        madrasaName: data.name,
        tagline: data.tagline,
        logoUrl: data.logoUrl || "",
        faviconUrl: data.logoUrl || "",
        country: data.country,
        website: data.subdomain ? `https://${data.subdomain}.${appDomain}` : "",
      }),
    [data.name, data.tagline, data.logoUrl, data.country, data.subdomain, appDomain],
  );

  const resolvedFooter =
    data.footerText.trim() || defaultFooterForMadrasa(data.name, language);

  useEffect(() => {
    applyBrandingTheme({
      primaryColor: data.primaryColor || DEFAULT_BRANDING_SETTINGS.primaryColor,
      secondaryColor: data.secondaryColor || DEFAULT_BRANDING_SETTINGS.secondaryColor,
    });
  }, [data.primaryColor, data.secondaryColor]);

  const handleNameChange = (nameValue: string) => {
    onChange((prev) => ({
      ...prev,
      name: nameValue.slice(0, NAME_MAX),
      subdomain: prev.subdomainTouched ? prev.subdomain : slugifySubdomain(nameValue),
    }));
  };

  const handleSubdomainChange = (subdomainValue: string) => {
    onChange((prev) => ({
      ...prev,
      subdomain: slugifySubdomain(subdomainValue),
      subdomainTouched: true,
    }));
  };

  return (
    <div className="space-y-6">
      <SectionCard title={t("branding.previewTitle")} subtitle={t("branding.previewSubtitle")}>
        <BrandingIdentityPreview data={previewBranding} />
      </SectionCard>

      <SectionCard
        title={t("branding.identityTitle")}
        subtitle={t("branding.identitySubtitle")}
        icon={Type}
      >
        <div className="space-y-4">
          <ImageUploadField
            id="onboarding-logo"
            label={t("branding.logo")}
            hint={t("branding.logoHint")}
            value={data.logoUrl || ""}
            purpose="logo"
            onChange={(url) => updateField("logoUrl", url)}
            onClear={() => updateField("logoUrl", "")}
            onBrandColorsExtracted={(colors) => {
              onChange((prev) => ({
                ...prev,
                primaryColor: colors.primaryColor,
                secondaryColor: colors.secondaryColor,
              }));
            }}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="onboarding-name">{t("branding.madrasaName")}</Label>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {data.name.length}/{NAME_MAX}
              </span>
            </div>
            <Input
              id="onboarding-name"
              value={data.name}
              maxLength={NAME_MAX}
              placeholder={t("branding.madrasaNamePlaceholder")}
              aria-describedby="onboarding-name-hint"
              onChange={(event) => handleNameChange(event.target.value)}
            />
            <FieldHint id="onboarding-name-hint">{t("branding.madrasaNameHint")}</FieldHint>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="onboarding-tagline">{t("branding.tagline")}</Label>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {data.tagline.length}/{TAGLINE_MAX}
              </span>
            </div>
            <Input
              id="onboarding-tagline"
              value={data.tagline}
              maxLength={TAGLINE_MAX}
              placeholder={t("branding.taglinePlaceholder")}
              aria-describedby="onboarding-tagline-hint"
              onChange={(event) => updateField("tagline", event.target.value)}
            />
            <FieldHint id="onboarding-tagline-hint">{t("branding.taglineHint")}</FieldHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-country">{t("branding.country")}</Label>
            <Input
              id="onboarding-country"
              value={data.country}
              autoComplete="country-name"
              placeholder={t("branding.countryPlaceholder")}
              onChange={(event) => updateField("country", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-subdomain">
              {t("onboarding.madrasa.subdomainLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center overflow-hidden rounded-lg border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="flex items-center gap-1.5 border-e border-border bg-muted px-3 py-2.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </div>
              <Input
                id="onboarding-subdomain"
                value={data.subdomain}
                placeholder="al-noor"
                className="border-0 rounded-none focus-visible:ring-0"
                onChange={(event) => handleSubdomainChange(event.target.value)}
              />
              <div className="border-s border-border bg-muted px-3 py-2.5">
                <span className="text-xs text-muted-foreground">.{appDomain}</span>
              </div>
            </div>
            {data.subdomain && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" aria-hidden />
                {t("onboarding.madrasa.yourUrl")}{" "}
                <span className="font-medium text-foreground">
                  {data.subdomain}.{appDomain}
                </span>
              </p>
            )}
          </div>
        </div>
      </SectionCard>

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
            onClick={() => updateField("footerText", defaultFooterForMadrasa(data.name, language))}
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
            placeholder={defaultFooterForMadrasa(data.name, language)}
            aria-describedby="onboarding-footer-hint"
            onChange={(event) => updateField("footerText", event.target.value)}
          />
          <FieldHint id="onboarding-footer-hint">{t("theme.footerHint")}</FieldHint>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-[11px] text-muted-foreground">{t("theme.footerPreviewLabel")}</p>
          <p className="mt-1 text-xs text-foreground">{resolvedFooter}</p>
        </div>
      </SectionCard>
    </div>
  );
}
