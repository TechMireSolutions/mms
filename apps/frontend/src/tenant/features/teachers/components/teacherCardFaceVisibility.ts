import type { ModuleColumnRegistryEntry } from "@mms/shared";

/**
 * Card face-chrome visibility for Teachers.
 *
 * Students/Contacts gate GR/gender/phone/email pills on registry columns because
 * those keys ARE registry columns there. Teacher face chrome (`employeeId`,
 * `gender`, `phone`, `email`) is not part of the Work column registry, so the
 * registry-based `isColumnVisible` would always hide it. Parity semantics:
 * a face key defaults to visible unless a registry column explicitly disables it.
 */
export function resolveTeacherCardFaceVisibility(
  columnRegistry: ModuleColumnRegistryEntry[],
  isColumnVisible: (key: string) => boolean,
): (key: string) => boolean {
  const registryKeys = new Set(columnRegistry.map((column) => column.key));
  return (key: string) => {
    if (!registryKeys.has(key)) return true;
    return isColumnVisible(key);
  };
}
