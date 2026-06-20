import React from 'react';
import { ContactConfigProvider } from '@/lib/contexts/ContactConfigContext';
import { useIsTenantHost } from '@/hooks/useIsTenantHost';

/** Mounts tenant-only providers (contacts config) — skipped on platform apex. */
export default function TenantScopedProviders({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const isTenantHost = useIsTenantHost();

  if (!isTenantHost) {
    return <>{children}</>;
  }

  return <ContactConfigProvider>{children}</ContactConfigProvider>;
}
