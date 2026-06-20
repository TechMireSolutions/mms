import React from "react";
import { useIsTenantHost } from "@/lib/host/useIsTenantHost";
import { ApexRoutesWithSuspense } from "@/platform/routes/ApexRoutes";
import TenantRoutes from "@/tenant/routes/TenantRoutes";

/**
 * Host switch — renders exactly one of platform apex or tenant madrasa trees.
 */
export default function HostRoutes(): React.JSX.Element {
  const isTenantHost = useIsTenantHost();

  if (isTenantHost) {
    return <TenantRoutes />;
  }

  return <ApexRoutesWithSuspense />;
}
