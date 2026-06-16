import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/lib/contexts/TenantContext";
import { ROUTES } from "@/lib/config/routes";
import { apexUrl } from "@/lib/config/tenantConfig";

/**
 * Onboarding & marketing — only on the apex domain (not tenant subdomains).
 */
export function RequireApexHost(): React.JSX.Element {
  const { isApex } = useTenant();

  if (!isApex) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}

/**
 * Signed-in app & tenant login — only on {subdomain}.{domain}, never the apex host.
 */
export function RequireTenantHost(): React.JSX.Element {
  const { isApex, workspaceLoading, workspace, subdomain } = useTenant();

  if (isApex) {
    window.location.href = apexUrl(ROUTES.onboarding);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace && subdomain) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">Workspace not found</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          No madrasa is registered at <span className="font-mono">{subdomain}</span>.
          Create one on the main site first.
        </p>
        <a href={apexUrl(ROUTES.onboarding)} className="text-primary font-medium hover:underline">
          Create your madrasa →
        </a>
      </div>
    );
  }

  return <Outlet />;
}
