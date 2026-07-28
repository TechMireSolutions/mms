import { useEffect, useState } from "react";
import {
  useContactGoogleSyncConfig,
  useContactGoogleSyncMutations,
  CONTACTS_GOOGLE_SYNC_QUERY_KEY,
} from "@/tenant/features/contacts/hooks/useContacts";
import { useGoogleContactsOAuth } from "@/tenant/features/contacts/hooks/useGoogleContactsOAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { type Contact, type ContactGoogleSyncConfigClient } from "@mms/shared";
import { isApiError } from "@/lib/apiClient";
import { queryClientInstance } from "@/lib/queryClient";

export function useGoogleContactsSync({
  onImport,
  canWrite = true,
}: {
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}) {
  const { t } = useTranslation();
  const { data: serverConfig, isLoading: configLoading } = useContactGoogleSyncConfig();
  const { saveConfig, logSyncAudit, exchangeOAuth, runGoogleSync } = useContactGoogleSyncMutations();
  const [config, setConfig] = useState<ContactGoogleSyncConfigClient>({});
  const [showSetup, setShowSetup] = useState(false);
  const [form, setForm] = useState({ clientId: "", clientSecret: "" });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ total: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState("");
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (serverConfig) {
      setConfig({ clientId: serverConfig.clientId });
    }
  }, [serverConfig]);

  useEffect(() => {
    setForm({ clientId: config.clientId || "", clientSecret: config.clientSecret || "" });
  }, [config.clientId, config.clientSecret]);

  const isConfigured = !!(config.clientId && (config.clientSecret || serverConfig?.hasClientSecret));
  const isConnected = serverConfig?.isConnected ?? false;

  const { handleConnect, handleExchangeCode } = useGoogleContactsOAuth({
    canWrite,
    config,
    setConfig,
    isConfigured,
    configLoading,
    exchangeOAuth,
    setError,
    setShowAuthCode,
    setAuthCode,
    setExchanging,
    t,
  });

  const handleSaveCredentials = async (): Promise<void> => {
    if (!canWrite) return;
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError(t("contacts.sync.clientIdRequired"));
      return;
    }
    const updatedConfig: ContactGoogleSyncConfigClient = {
      ...config,
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
    };
    try {
      await saveConfig.mutateAsync(updatedConfig);
      setConfig(updatedConfig);
      setShowSetup(false);
      setError("");
      void logSyncAudit.mutateAsync({ action: "credentials_saved" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    }
  };

  const handleSync = async (): Promise<void> => {
    if (!canWrite || !isConnected) return;
    setSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const result = await runGoogleSync.mutateAsync();
      await onImport(result.contacts);
      setSyncResult({ total: result.total, imported: result.imported, skipped: result.skipped });
    } catch (syncError) {
      if (isApiError(syncError) && syncError.type === "session_expired") {
        await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
        setError(t("contacts.sync.sessionExpired"));
        return;
      }
      const message = syncError instanceof Error ? syncError.message : String(syncError);
      setError(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (!canWrite) return;
    const disconnectedConfig: ContactGoogleSyncConfigClient = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    };
    try {
      await saveConfig.mutateAsync({ clientId: config.clientId, clearTokens: true });
      setConfig(disconnectedConfig);
      void logSyncAudit.mutateAsync({ action: "disconnected" });
      await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
      setSyncResult(null);
      setError("");
      setShowAuthCode(false);
      setAuthCode("");
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : String(disconnectError));
    }
  };

  return {
    canWrite,
    form,
    setForm,
    showSetup,
    setShowSetup,
    syncing,
    syncResult,
    error,
    setError,
    showAuthCode,
    authCode,
    setAuthCode,
    exchanging,
    isConfigured,
    isConnected,
    handleSaveCredentials,
    handleConnect,
    handleExchangeCode: () => handleExchangeCode(authCode),
    handleSync,
    handleDisconnect,
  };
}
