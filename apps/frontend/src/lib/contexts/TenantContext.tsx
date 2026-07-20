import React, { createContext, useContext, useMemo } from "react";
import {
  parseTenantFromHost,
  isApexHost,
  buildTenantUrl,
  buildApexUrl,
  type PublicBranding,
} from "@mms/shared";
import { getTenantUrlOptions } from "@/lib/config/tenantConfig";
import { useDeploymentAppDomain } from "@/tenant/hooks/useDeploymentAppDomain";
import { usePublicBranding } from "@/tenant/hooks/usePublicBranding";
import {
  useWorkspaceBySubdomain,
  type PublicWorkspace,
} from "@/tenant/hooks/useWorkspaceBySubdomain";

export type { PublicWorkspace };

export interface TenantContextValue {
  appDomain: string;
  subdomain: string | null;
  isApex: boolean;
  workspace: PublicWorkspace | null;
  publicBranding: PublicBranding | null;
  workspaceLoading: boolean;
  workspaceUrl: string | null;
  redirectToApex: (path?: string) => void;
  redirectToTenant: (subdomain: string, path?: string) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const appDomain = useDeploymentAppDomain();
  const subdomain = useMemo(
    () => (typeof window !== "undefined" ? parseTenantFromHost(hostname, appDomain) : null),
    [hostname, appDomain],
  );
  const isApex = useMemo(
    () => (typeof window !== "undefined" ? isApexHost(hostname, appDomain) : true),
    [hostname, appDomain],
  );

  const tenantLookupEnabled = !isApex && Boolean(subdomain);
  const { data: workspaceLookup, isPending, isFetching } = useWorkspaceBySubdomain(
    subdomain,
    tenantLookupEnabled,
  );
  const workspaceLoading = tenantLookupEnabled && (isPending || isFetching);
  const workspace = workspaceLookup?.workspace ?? null;
  const needsBrandingFallback = tenantLookupEnabled && !workspaceLoading && workspace === null;
  const { data: fallbackBranding = null } = usePublicBranding(needsBrandingFallback);
  const publicBranding = workspaceLookup?.branding ?? fallbackBranding;

  const workspaceUrl = subdomain
    ? buildTenantUrl(subdomain, "/", getTenantUrlOptions())
    : null;

  const redirectToApex = (path = "/") => {
    window.location.href = buildApexUrl(path, getTenantUrlOptions());
  };

  const redirectToTenant = (targetSubdomain: string, path = "/") => {
    window.location.href = buildTenantUrl(targetSubdomain, path, getTenantUrlOptions());
  };

  const value: TenantContextValue = {
    appDomain,
    subdomain,
    isApex,
    workspace,
    publicBranding,
    workspaceLoading,
    workspaceUrl,
    redirectToApex,
    redirectToTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export function useTenant(): TenantContextValue {
  const tenantContext = useContext(TenantContext);
  if (!tenantContext) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return tenantContext;
}
