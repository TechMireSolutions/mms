import type React from 'react';
import type { ModuleColumnRegistryEntry } from '@mms/shared';

export interface ModuleColumnCustomizerLabels {
  trigger: string;
  title: string;
  visibleAndOrder: string;
  hidden: string;
  fixed: string;
  hideColumn: (label: string) => string;
  showColumn?: (label: string) => string;
  reset?: string;
  searchPlaceholder?: string;
  showAll?: string;
  hideAll?: string;
  visibleCount?: (visible: number, total: number) => string;
  noMatches?: string;
}

export interface ModuleColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  onResetLayout?: () => void;
  labels?: Partial<ModuleColumnCustomizerLabels>;
  className?: string;
  disabled?: boolean;
}

export interface ModuleColumnCustomizerListProps {
  visibleColumns: ModuleColumnRegistryEntry[];
  hiddenColumns: ModuleColumnRegistryEntry[];
  dragging: string | null;
  dragOver: string | null;
  labels: ModuleColumnCustomizerLabels;
  toggle: (columnKey: string) => void;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, columnKey: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, columnKey: string) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, targetColumnKey: string) => void;
  clearDrag: () => void;
  showAll?: () => void;
  hideAll?: () => void;
  hasNonFixedHidden?: boolean;
  hasNonFixedVisible?: boolean;
  isSearching?: boolean;
}
