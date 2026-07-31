import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { registerAppNavigate, unregisterAppNavigate } from "@/lib/routing/appNavigate";
import { applyAppTheme } from "@/lib/brandingTheme";
import { applyApexPlatformTheme } from "@/lib/brandingThemeCore";
import { revertSettingsPreviews } from "@/lib/settingsPreview";
import { useScrollToTopOnNavigate } from "@/lib/routing/useScrollToTopOnNavigate";
import { useTenant } from "@/lib/contexts/TenantContext";
import { shouldForcePlatformEnglish } from "@/platform/lib/themeScope";

/**
 * Registers React Router navigate for imperative redirects (logout, etc.)
 * and reapplies document theme/language when the host or route scope changes.
 */
export default function RouterBridge(): null {
  const navigate = useNavigate();
  const location = useLocation();
  const { isApex, workspace, workspaceLoading, workspaceMissing, workspaceLookupFailed } = useTenant();
  useScrollToTopOnNavigate();

  useEffect(() => {
    registerAppNavigate((path, options) => {
      navigate(path, { replace: options?.replace ?? false });
    });
    return unregisterAppNavigate;
  }, [navigate]);

  useEffect(() => {
    if (!location.pathname.startsWith("/settings")) {
      revertSettingsPreviews();
    }
    if (
      shouldForcePlatformEnglish({
        isApex,
        workspaceLoading,
        workspace,
        workspaceLookupFailed,
      }) ||
      workspaceMissing
    ) {
      applyApexPlatformTheme("en");
      return;
    }
    applyAppTheme(location.pathname);
  }, [
    location.pathname,
    isApex,
    workspace,
    workspaceLoading,
    workspaceMissing,
    workspaceLookupFailed,
  ]);

  return null;
}
