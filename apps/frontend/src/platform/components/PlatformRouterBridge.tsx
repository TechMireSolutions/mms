import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerAppNavigate, unregisterAppNavigate } from "@/lib/routing/appNavigate";

/**
 * Registers React Router navigate for imperative redirects (logout, etc.) on the platform apex.
 * Bypasses all tenant theme calculations, settings previews, and document language modifications.
 */
export function PlatformRouterBridge(): null {
  const navigate = useNavigate();

  useEffect(() => {
    registerAppNavigate((path, options) => {
      navigate(path, { replace: options?.replace ?? false });
    });
    return unregisterAppNavigate;
  }, [navigate]);

  return null;
}
