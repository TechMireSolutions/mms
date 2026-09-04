import React from "react";
import { useIsTenantHost } from "@/lib/host/useIsTenantHost";
const TenantRoutes = React.lazy(() => import("@/tenant/routes/TenantRoutes"));
const ApexRoutesWithSuspense = React.lazy(() =>
  import("@/platform/routes/ApexRoutes").then((m) => ({ default: m.ApexRoutesWithSuspense }))
);

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
