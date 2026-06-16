import { useEffect, useState } from "react";
import { type PublicBranding } from "@mms/shared";
import { cachePublicBranding } from "@/lib/db";
import { apiJson } from "@/lib/apiClient";
import { useTenant } from "@/lib/TenantContext";

/**
 * Blocks tenant auth UI until workspace branding has been fetched from the server.
 * Apex hosts skip the wait; failed workspace lookups fall back to `/public-branding`.
 */
export function useTenantBranding(): { ready: boolean } {
  const { isApex, workspaceLoading, workspace } = useTenant();
  const [fallbackDone, setFallbackDone] = useState(isApex);

  useEffect(() => {
    if (isApex || workspaceLoading || workspace) {
      setFallbackDone(true);
      return;
    }

    let cancelled = false;
    setFallbackDone(false);

    void apiJson<{ branding?: PublicBranding }>("/api/workspace/public-branding")
      .then((data) => {
        if (!cancelled && data.branding) {
          cachePublicBranding(data.branding);
        }
      })
      .finally(() => {
        if (!cancelled) setFallbackDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isApex, workspaceLoading, workspace]);

  const ready = isApex || (!workspaceLoading && (workspace !== null || fallbackDone));

  return { ready };
}

export default useTenantBranding;
