/** Two-letter badge code for a relationship type label (Parent → PA). */
export function relationshipBadgeCode(relationship: string): string {
  const trimmed = relationship.trim();
  if (!trimmed) return "—";
  return trimmed.slice(0, 2).toUpperCase();
}
