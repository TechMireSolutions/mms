/** Shared gender accent classes for Work directory entity cards. */
export function getGenderAccentBarClass(
  isSelected: boolean,
  gender?: string | null,
): string {
  if (isSelected) return "bg-primary/70 group-hover:bg-primary";
  const g = gender?.toLowerCase();
  if (g === "male") return "bg-info/50 group-hover:bg-info";
  if (g === "female") return "bg-secondary/50 group-hover:bg-secondary";
  return "bg-muted-foreground/35 group-hover:bg-muted-foreground/60";
}
