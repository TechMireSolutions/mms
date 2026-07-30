import React from "react";
import { Globe, Check, Type } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/FormSelect";
import BrandingIdentityPreview from "@/tenant/features/settings/components/branding/BrandingIdentityPreview";
import {
  FieldHint,
  ImageUploadField,
  NAME_MAX,
  TAGLINE_MAX,
} from "@/tenant/features/settings/components/branding/BrandingShared";
import type { CreateMadrasaController } from "@/platform/pages/onboarding/steps/useCreateMadrasaController";

interface CreateMadrasaIdentitySectionProps {
  controller: CreateMadrasaController;
}

export function CreateMadrasaIdentitySection({ controller }: CreateMadrasaIdentitySectionProps): React.ReactElement {
  const {
    t,
    appDomain,
    data,
    onChange,
    updateField,
    previewBranding,
    handleNameChange,
    handleSubdomainChange,
    countryOptions,
  } = controller;

  return (
    <>
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
              name="madrasaName"
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
              name="madrasaTagline"
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
            <FormSelect
              id="onboarding-country"
              name="madrasaCountry"
              value={data.country}
              onChange={(val) => updateField("country", val)}
              options={countryOptions}
              placeholder={t("branding.countryPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-province">{t("contacts.setup.defaultProvince")}</Label>
            <Input
              id="onboarding-province"
              name="madrasaProvince"
              value={data.province}
              placeholder={t("contacts.setup.defaultProvincePlaceholder")}
              onChange={(event) => updateField("province", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-city">{t("contacts.setup.defaultCity")}</Label>
            <Input
              id="onboarding-city"
              name="madrasaCity"
              value={data.city}
              placeholder={t("contacts.setup.defaultCityPlaceholder")}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-subdomain">
              {t("onboarding.madrasa.subdomainLabel")} <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <div className="flex items-center overflow-hidden rounded-lg border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="flex items-center gap-1.5 border-e border-border bg-muted px-3 py-2.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </div>
              <Input
                id="onboarding-subdomain"
                name="madrasaSubdomain"
                value={data.subdomain}
                placeholder={t("onboarding.madrasa.subdomainPlaceholder")}
                required
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
    </>
  );
}
