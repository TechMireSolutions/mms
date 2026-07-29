import React from "react";
import {
  Globe,
  Key, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { type Contact } from "@mms/shared";
import { useGoogleContactsSync } from "@/tenant/features/contacts/hooks/useGoogleContactsSync";
import {
  GoogleContactsConnectStep,
  GoogleContactsConnectedState,
  GoogleContactsSetupForm,
  GoogleContactsSetupHint,
} from "@/tenant/features/contacts/components/sync/GoogleContactsPanelSections";

export interface GoogleContactsPanelProps {
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
export function GoogleContactsPanel({ onImport, canWrite = true }: GoogleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const sync = useGoogleContactsSync({ onImport, canWrite });

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">{t('contacts.sync.googleTitle')}</span>
          {sync.isConnected && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30">
              {t('contacts.sync.connected')}
            </span>
          )}
        </div>
        {canWrite && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => sync.setShowSetup((v) => !v)}
            className="text-xs font-medium min-h-11 text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors shadow-none"
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
