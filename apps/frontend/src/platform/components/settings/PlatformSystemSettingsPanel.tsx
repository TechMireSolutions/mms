import React from 'react';
import { PlatformSystemMaintenance } from '@/platform/components/PlatformSystemMaintenance';

export function PlatformSystemSettingsPanel(): React.JSX.Element {
  return (
    <div className="space-y-6 text-start">
      <PlatformSystemMaintenance />
    </div>
  );
}
