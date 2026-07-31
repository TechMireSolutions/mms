import React from "react";
import {
  Globe,
  Key, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoogleContactsSync } from "@/tenant/features/contacts/hooks/useGoogleContactsSync";
import {
  GoogleContactsConnectStep,
  GoogleContactsConnectedState,
  GoogleContactsSetupForm,
  GoogleContactsSetupHint,
} from "@/tenant/features/contacts/components/sync/GoogleContactsPanelSections";

export interface GoogleContactsPanelProps {
  canWrite?: boolean;
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
export function GoogleContactsPanel({ canWrite = true }: GoogleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const sync = useGoogleContactsSync({ canWrite });

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="min-w-0 truncate text-sm font-bold text-foreground">{t('contacts.sync.googleTitle')}</span>
          {sync.isConnected && (
            <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 text-xs font-bold text-success">
              {t('contacts.sync.connected')}
            </span>
          )}
        </div>
        {canWrite && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => sync.setShowSetup((v) => !v)}
            className="flex min-h-11 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none"
          >
            <Key className="w-3 h-3" />
            <span>{sync.isConfigured ? t('contacts.sync.editCredentials') : t('contacts.sync.setup')}</span>
            {sync.showSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4 text-start">
        {!sync.isConfigured && !sync.showSetup && (
          <GoogleContactsSetupHint t={t} />
        )}

        {canWrite && sync.showSetup && (
          <GoogleContactsSetupForm
            clientId={sync.form.clientId}
            clientSecret={sync.form.clientSecret}
            error={sync.error}
            onClientIdChange={(value) => sync.setForm((form) => ({ ...form, clientId: value }))}
            onClientSecretChange={(value) => sync.setForm((form) => ({ ...form, clientSecret: value }))}
            onSave={() => void sync.handleSaveCredentials()}
            onCancel={() => {
              sync.setShowSetup(false);
              sync.setError("");
            }}
            t={t}
          />
        )}

        {sync.isConfigured && !sync.isConnected && !sync.showSetup && canWrite && (
          <GoogleContactsConnectStep
            showAuthCode={sync.showAuthCode}
            authCode={sync.authCode}
            exchanging={sync.exchanging}
            error={sync.error}
            onConnect={sync.handleConnect}
            onAuthCodeChange={sync.setAuthCode}
            onExchangeCode={() => void sync.handleExchangeCode()}
            t={t}
          />
        )}

        {sync.isConnected && (
          <GoogleContactsConnectedState
            canWrite={canWrite}
            error={sync.error}
            syncResult={sync.syncResult}
            syncing={sync.syncing}
            onDisconnect={() => void sync.handleDisconnect()}
            onSync={() => void sync.handleSync()}
            t={t}
          />
        )}
      </div>
    </section>
  );
}
