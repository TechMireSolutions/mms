import {
  useDirectoryTrashState,
  type DirectoryTrashStateTuple,
} from "@/hooks/useDirectoryTrashState";

/**
 * Hook to synchronize soft-delete trash mode (?view=trash or ?archived=true)
 * with URL search params per MMS Soft-Delete System §7.1 and §7.10.
 *
 * @deprecated Prefer `useDirectoryTrashState` directly.
 */
export function useTrashMode(): [
  boolean,
  (showDeleted: boolean | ((prev: boolean) => boolean)) => void,
] {
  const [viewingDeleted, setViewingDeleted] = useDirectoryTrashState();
  return [viewingDeleted, setViewingDeleted];
}

export { useDirectoryTrashState, type DirectoryTrashStateTuple };

