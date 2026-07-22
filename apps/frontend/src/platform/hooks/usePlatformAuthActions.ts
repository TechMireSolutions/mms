import { useMutation } from '@tanstack/react-query';
import type {
  PlatformPasswordForgotInput,
  PlatformPasswordForgotResult,
  PlatformPasswordResetInput,
  PlatformSetupRegisterInput,
  PlatformSetupRegisterResult,
  PlatformUser,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';

/** Hook to start platform setup registration. */
export function usePlatformSetupRegister() {
  return useMutation({
    mutationFn: async (input: PlatformSetupRegisterInput) =>
      apiJson<PlatformSetupRegisterResult>('/api/platform/auth/setup/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

/** Hook to verify platform setup OTP code. */
export function usePlatformSetupVerify() {
  return useMutation({
    mutationFn: async ({ setupId, code }: { setupId: string; code: string }) =>
      apiJson<{ user: PlatformUser }>('/api/platform/auth/setup/verify', {
        method: 'POST',
        body: JSON.stringify({ setupId, code }),
      }),
  });
}

/** Hook to resend platform setup verification code. */
export function usePlatformSetupResend() {
  return useMutation({
    mutationFn: async (setupId: string) =>
      apiJson<PlatformSetupRegisterResult>('/api/platform/auth/setup/resend', {
        method: 'POST',
        body: JSON.stringify({ setupId }),
      }),
  });
}

/** Hook to request a platform password reset code. */
export function usePlatformPasswordForgot() {
  return useMutation({
    mutationFn: async (input: PlatformPasswordForgotInput) =>
      apiJson<PlatformPasswordForgotResult>('/api/platform/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

/** Hook to complete platform password reset with OTP code and new password. */
export function usePlatformPasswordReset() {
  return useMutation({
    mutationFn: async (input: PlatformPasswordResetInput) =>
      apiJson<{ user: PlatformUser }>('/api/platform/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

/** Hook to resend platform password reset code. */
export function usePlatformPasswordResetResend() {
  return useMutation({
    mutationFn: async (resetId: string) =>
      apiJson<PlatformPasswordForgotResult>('/api/platform/auth/password/resend', {
        method: 'POST',
        body: JSON.stringify({ resetId }),
      }),
  });
}
