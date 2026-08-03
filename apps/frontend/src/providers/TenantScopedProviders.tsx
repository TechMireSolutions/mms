import React from 'react';
import { ContactConfigProvider } from '@/lib/contexts/ContactConfigContext';
import { useIsTenantHost } from '@/lib/host/useIsTenantHost';
import { useTenantDatabaseUpdates } from '@/hooks/useTenantDatabaseUpdates';

function TenantLivePushSubscriber(): null {
  useTenantDatabaseUpdates();
  return null;
}

/** Mounts tenant-only providers (contacts config + live push) — skipped on platform apex. */
export default function TenantScopedProviders({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const isTenantHost = useIsTenantHost();

  if (!isTenantHost) {
    return <>{children}</>;
  }

  return (
    <ContactConfigProvider>
      <TenantLivePushSubscriber />
      {children}
    </ContactConfigProvider>
  );
}
