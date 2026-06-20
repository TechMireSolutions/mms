import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { isApexHost } from '@mms/shared'
import { getAppDomain } from '@/lib/config/tenantConfig'
import { applyApexPlatformTheme } from '@/lib/brandingThemeCore'

if (typeof window !== 'undefined' && isApexHost(window.location.hostname, getAppDomain())) {
  applyApexPlatformTheme('en')
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'.");
}

const app = <App />;

ReactDOM.createRoot(rootElement).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app,
)
