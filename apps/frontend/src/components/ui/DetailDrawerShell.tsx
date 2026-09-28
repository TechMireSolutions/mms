import React from "react";
import { Drawer, type DrawerProps, type DrawerSize } from "@/components/ui/Drawer";

export type DetailDrawerSize = DrawerSize;
export type DetailDrawerShellProps = DrawerProps;

let warned = false;

/**
 * @deprecated DetailDrawerShell is deprecated and will be removed in a future release.
 * Use `Drawer` from `@/components/ui/Drawer` instead.
 */
export function DetailDrawerShell(props: DetailDrawerShellProps): React.JSX.Element | null {
  if (process.env.NODE_ENV !== "production" && !warned) {
    warned = true;
    console.warn(
      "[MMS Deprecation] `DetailDrawerShell` is deprecated. Migrate to `Drawer` from `@/components/ui/Drawer`.",
    );
  }
  return <Drawer {...props} />;
}
