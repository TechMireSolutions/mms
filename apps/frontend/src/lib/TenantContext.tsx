import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  parseTenantFromHost,
  isApexHost,
  buildTenantUrl,
  buildApexUrl,
  type PublicBranding,
} from "@mms/shared";
import { cachePublicBranding } from "./db";
import { apiJson } from "./apiClient";
import { getAppDomain, getTenantUrlOptions } from "./tenantConfig";

interface PublicWorkspace {
  subdomain: string;
  madrasaName: string;
  tagline?: string;
}

export interface TenantContextValue {
  appDomain: string;
  subdomain: string | null;
  isApex: boolean;
  workspace: PublicWorkspace | null;
  workspaceLoading: boolean;
  workspaceUrl: string | null;
  redirectToApex: (path?: string) => void;
  redirectToTenant: (subdomain: string, path?: string) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const appDomain = getAppDomain();
  const subdomain = useMemo(
    () => (typeof window !== "undefined" ? parseTenantFromHost(hostname, appDomain) : null),
    [hostname, appDomain]
  );
  const isApex = useMemo(
    () => (typeof window !== "undefined" ? isApexHost(hostname, appDomain) : true),
    [hostname, appDomain]
  );

  const [workspace, setWorkspace] = useState<PublicWorkspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(!isApex);

  useEffect(() => {
    if (isApex || !subdomain) {
      setWorkspace(null);
      setWorkspaceLoading(false);
      return;
    }

    let cancelled = false;
    setWorkspaceLoading(true);

    void apiJson<{
      workspace: PublicWorkspace;
      branding?: PublicBranding;
    }>(`/api/workspace/by-subdomain/${encodeURIComponent(subdomain)}`)
      .then((data) => {
        if (!cancelled) {
          if (data.branding) {
            cachePublicBranding(data.branding);
          }
          setWorkspace(data.workspace);
        }
      })
      .catch(() => {
        if (!cancelled) setWorkspace(null);
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isApex, subdomain]);

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
    workspaceLoading,
    workspaceUrl,
    redirectToApex,
    redirectToTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
