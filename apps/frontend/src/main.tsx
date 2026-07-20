import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { isApexHost } from '@mms/shared'
import { getAppDomain } from '@/lib/config/tenantConfig'
import { initErrorReporting } from '@/lib/clientErrorReporting'

initErrorReporting()
if (typeof window !== 'undefined' && isApexHost(window.location.hostname, getAppDomain())) {
  void import('@/lib/brandingThemeCore').then(({ applyApexPlatformTheme }) => {
    applyApexPlatformTheme('en');
  });
} else {
  void import('@/lib/brandingTheme').then(({ applyAppTheme }) => applyAppTheme())
}

// Suppress Recharts v3 false-positive dimension warnings during mounting
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('The width(-1) and height(-1) of chart should be greater than 0')
  ) {
    return;
  }
  originalWarn(...args);
};

import * as Sentry from '@sentry/react'
import { ErrorState } from '@/components/ui/ErrorState'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'.");
}

const app = (
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <ErrorState
          title="Application Crash"
          description={error instanceof Error ? error.message : "A critical error occurred. The application has crashed."}
          onRetry={() => {
            resetError();
            window.location.reload();
          }}
        />
      </div>
    )}
  >
    <App />
  </Sentry.ErrorBoundary>
);

ReactDOM.createRoot(rootElement).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app,
)
