import React, { useEffect } from "react";
import { applyApexPlatformTheme } from "@/lib/brandingThemeCore";
import { PlatformAppProviders } from "@/providers/PlatformAppProviders";
import { PlatformRouterBridge } from "@/platform/components/PlatformRouterBridge";
import ApexRoutes from "@/platform/routes/ApexRoutes";

export default function PlatformApp(): React.JSX.Element {
  useEffect(() => {
    // Platform host defaults strictly to English theme settings
    applyApexPlatformTheme("en");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      applyApexPlatformTheme("en");
    };
    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return (
    <PlatformAppProviders>
      <PlatformRouterBridge />
      <ApexRoutes />
    </PlatformAppProviders>
  );
}
