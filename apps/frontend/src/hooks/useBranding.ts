import { useState, useEffect } from "react";
import { type BrandingSettings } from "@mms/shared";
import { applyAppTheme } from "../lib/brandingTheme";
import { getScopedBrandingSettings } from "../lib/settingsPreviewStore";
import { SETTINGS_PREVIEW_EVENT } from "../lib/settingsPreview";
import { isTenantHost } from "../lib/themeScope";

/**
 * Custom React hook to load and track real-time changes to the institution's branding settings.
 *
 * @returns {BrandingSettings} The active branding settings object.
 */
export default function useBranding(): BrandingSettings {
  const [branding, setBranding] = useState<BrandingSettings>(() => getScopedBrandingSettings());

  useEffect(() => {
    const handleUpdate = (): void => {
      setBranding(getScopedBrandingSettings());
    };

    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener(SETTINGS_PREVIEW_EVENT, handleUpdate);

    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(SETTINGS_PREVIEW_EVENT, handleUpdate);
    };
  }, []);

  useEffect(() => {
    applyAppTheme();
  }, [branding.primaryColor, branding.secondaryColor, branding.cornerStyle, branding.logoUrl, branding.faviconUrl]);

  useEffect(() => {
    if (!isTenantHost()) {
      document.title = "Madrasa Management System";
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (link) link.href = "/favicon.svg";
      return;
    }
    if (branding.madrasaName) {
      document.title = `${branding.madrasaName} - Madrasa MS`;
    }
    const favicon = branding.faviconUrl || branding.logoUrl;
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [branding]);

  return branding;
}
