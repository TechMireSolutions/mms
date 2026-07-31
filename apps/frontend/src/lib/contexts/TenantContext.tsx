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
import {
  isWorkspaceNotFoundError,
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
  /** True when the subdomain host has no registered workspace (404 / empty). */
  workspaceMissing: boolean;
  /** True when workspace lookup failed for a non-404 reason (network / 5xx). */
  workspaceLookupFailed: boolean;
  workspaceUrl: string | null;
  refetchWorkspace: () => void;
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
  const {
    data: workspaceLookup,
    error: workspaceError,
    isPending,
    isFetching,
    isError,
    isFetched,
    refetch,
  } = useWorkspaceBySubdomain(subdomain, tenantLookupEnabled);
  const workspaceLoading = tenantLookupEnabled && (isPending || isFetching);
  const workspace = workspaceLookup?.workspace ?? null;
  const notFound = isWorkspaceNotFoundError(workspaceError);
  const workspaceMissing =
    tenantLookupEnabled &&
    !workspaceLoading &&
    (notFound || (isFetched && !isError && workspace === null));
  const workspaceLookupFailed =
    tenantLookupEnabled && !workspaceLoading && isError && !notFound;
  // Missing tenants hard-redirect to apex Tenant Not Found — skip branding fetch.
  const publicBranding = workspaceLookup?.branding ?? null;

  const workspaceUrl = subdomain
    ? buildTenantUrl(subdomain, "/", getTenantUrlOptions())
    : null;

  const refetchWorkspace = () => {
    void refetch();
  };

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
    workspaceMissing,
    workspaceLookupFailed,
    workspaceUrl,
    refetchWorkspace,
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
