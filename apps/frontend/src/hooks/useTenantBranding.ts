import { useTenant } from "@/lib/contexts/TenantContext";
import { usePublicBranding } from "@/hooks/usePublicBranding";

/**
 * Blocks tenant auth UI until workspace branding has been fetched from the server.
 * Apex hosts skip the wait; failed workspace lookups fall back to `/public-branding`.
 */
export function useTenantBranding(): { ready: boolean } {
  const { isApex, workspaceLoading, workspace } = useTenant();
  const needsFallback = !isApex && !workspaceLoading && workspace === null;
  const { isPending, isFetching, isFetched } = usePublicBranding(needsFallback);

  if (isApex) {
    return { ready: true };
  }

  if (workspaceLoading) {
    return { ready: false };
  }

  if (workspace !== null) {
    return { ready: true };
  }

  const ready = !needsFallback || (isFetched && !isPending && !isFetching);
  return { ready };
}

