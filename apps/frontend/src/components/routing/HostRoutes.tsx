import React from "react";
import { useIsTenantHost } from "@/hooks/useIsTenantHost";
import { ApexRoutesWithSuspense } from "@/components/routing/ApexRoutes";
import TenantRoutes from "@/components/routing/TenantRoutes";

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
