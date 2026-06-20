/** Platform (apex) domain — routes, pages, components, hooks, lib. */
export { default as ApexRoutes, ApexRoutesWithSuspense } from './routes/ApexRoutes';
export { usePlatformAuth, PlatformAuthProvider } from './lib/PlatformAuthContext';
export type { PlatformAuthContextType } from './lib/PlatformAuthContext';
