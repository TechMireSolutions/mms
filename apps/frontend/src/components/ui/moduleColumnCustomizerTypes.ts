import type { ModuleColumnRegistryEntry } from '@mms/shared';

export interface ModuleColumnCustomizerLabels {
  trigger: string;
  title: string;
  visibleAndOrder: string;
  hidden: string;
  fixed: string;
  hideColumn: (label: string) => string;
  reset?: string;
  searchPlaceholder?: string;
}

export interface ModuleColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  onResetLayout?: () => void;
  labels: ModuleColumnCustomizerLabels;
}
