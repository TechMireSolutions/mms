import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { registerAppNavigate, unregisterAppNavigate } from "@/lib/routing/appNavigate";
import { applyAppTheme } from "@/lib/brandingTheme";
import { revertSettingsPreviews } from "@/lib/settingsPreview";

/**
 * Registers React Router navigate for imperative redirects (logout, etc.)
 * and reapplies document language when crossing entry vs app routes.
 */
export default function RouterBridge(): null {
  const navigate = useNavigate();
  const location = useLocation();

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
    applyAppTheme(location.pathname);
  }, [location.pathname]);

  return null;
}
