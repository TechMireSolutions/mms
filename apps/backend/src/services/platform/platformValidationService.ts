import {
  type PlatformPasswordForgotResult,
} from '@mms/shared';

/**
 * Normalizes OTP dispatching results for non-production environments to avoid code duplication in password reset flows.
 */
export function buildDevForgotResult(
  dispatch: { sent: boolean; devCode?: string },
  resetId: string,
): PlatformPasswordForgotResult {
  const result: PlatformPasswordForgotResult = { accepted: true };
  if (process.env.NODE_ENV !== 'production' && dispatch.devCode) {
    result.devReset = { resetId, code: dispatch.devCode };
  }
  return result;
}


