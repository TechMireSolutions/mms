import React, { useEffect } from "react";
import { applyAppTheme } from "@/lib/brandingTheme";
import { SETTINGS_PREVIEW_EVENT } from "@/lib/settingsPreview";
import { TenantAppProviders } from "@/providers/TenantAppProviders";
import RouterBridge from "@/components/routing/RouterBridge";
import TenantRoutes from "@/tenant/routes/TenantRoutes";
import { useWebSocketSync } from "@/tenant/hooks/useWebSocketSync";

export default function TenantApp(): React.JSX.Element {
  useWebSocketSync();

  useEffect(() => {
    applyAppTheme();

    const onThemeUpdate = () => {
      applyAppTheme();
    };
    window.addEventListener("local-database-update", onThemeUpdate);
    window.addEventListener(SETTINGS_PREVIEW_EVENT, onThemeUpdate);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      applyAppTheme();
    };
    mediaQuery.addEventListener("change", listener);

    return () => {
      window.removeEventListener("local-database-update", onThemeUpdate);
      window.removeEventListener(SETTINGS_PREVIEW_EVENT, onThemeUpdate);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return (
    <TenantAppProviders>
      <RouterBridge />
      <TenantRoutes />
    </TenantAppProviders>
  );
}
