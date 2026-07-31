/** Cross-tab hint that a platform cookie session may exist (logout / failure clear). */
const PLATFORM_BROWSER_SESSION_KEY = 'mms_platform_browser_session';

export function markPlatformBrowserSession(): void {
  try {
    localStorage.setItem(PLATFORM_BROWSER_SESSION_KEY, '1');
  } catch {
    /* localStorage unavailable */
  }
}

export function clearPlatformBrowserSession(): void {
  try {
    localStorage.removeItem(PLATFORM_BROWSER_SESSION_KEY);
    sessionStorage.removeItem(PLATFORM_BROWSER_SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}
