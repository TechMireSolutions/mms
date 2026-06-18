const PLATFORM_BROWSER_SESSION_KEY = 'mms_platform_browser_session';

export function markPlatformBrowserSession(): void {
  try {
    sessionStorage.setItem(PLATFORM_BROWSER_SESSION_KEY, '1');
  } catch {
    /* sessionStorage unavailable */
  }
}

export function clearPlatformBrowserSession(): void {
  try {
    sessionStorage.removeItem(PLATFORM_BROWSER_SESSION_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}
