import { useState } from 'react';
import type React from 'react';
import { apiContract } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import type { LlmConfig } from '@mms/shared';
import type { SandboxMessage } from './llmSettingsTypes';

export function useLlmSettingsSandbox(configs: LlmConfig[]) {
  const { t } = useTranslation();
  const [sandboxMessages, setSandboxMessages] = useState<SandboxMessage[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxConfigId, setSandboxConfigId] = useState<string>('');
  const [sandboxSystemInstruction, setSandboxSystemInstruction] = useState('');
  const [sandboxTesting, setSandboxTesting] = useState(false);

  const handleSendSandboxMessage = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const promptText = sandboxInput.trim();
    if (!promptText || sandboxTesting) return;

    const targetConfigId = sandboxConfigId || configs.find((config) => config.isDefaultText)?.id || configs[0]?.id;
    if (!targetConfigId) return;

    const userMsg: SandboxMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: promptText,
    };

    setSandboxMessages((prev) => [...prev, userMsg]);
    setSandboxInput('');
    setSandboxTesting(true);

    const historyForApi = [...sandboxMessages, userMsg].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const { status, body } = await apiContract.ai.test({
        body: {
          prompt: promptText,
          systemInstruction: sandboxSystemInstruction.trim() || undefined,
          configId: targetConfigId,
          messages: historyForApi,
        },
      });

      if (status === 200 && body.success && body.response) {
        setSandboxMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: body.response as string,
            metrics: body.metrics,
          },
        ]);
      } else {
        setSandboxMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: body?.message || t('settings.llmTestConnectionError'),
            error: true,
          },
        ]);
      }
    } catch (err: any) {
      setSandboxMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err.message || t('settings.llmSendFailed'),
          error: true,
        },
      ]);
    } finally {
      setSandboxTesting(false);
    }
  };

  return {
    sandboxMessages,
    setSandboxMessages,
    sandboxInput,
    setSandboxInput,
    sandboxConfigId,
    setSandboxConfigId,
    sandboxSystemInstruction,
    setSandboxSystemInstruction,
    sandboxTesting,
    handleSendSandboxMessage,
  };
}
