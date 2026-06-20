import { usePlatformSetupStatus } from '@/hooks/usePlatformSetupStatus';

/** Warms apex setup-status query in parallel with platform auth on boot. */
export default function ApexBootPrefetch(): null {
  usePlatformSetupStatus();
  return null;
}
