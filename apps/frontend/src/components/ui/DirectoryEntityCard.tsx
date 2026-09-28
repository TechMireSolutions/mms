import {
  EntityCard,
  entityCardVariants,
  entityCardVariantsReduced,
  type EntityCardProps,
} from "@/components/ui/EntityCard";

export const directoryEntityCardVariants = entityCardVariants;
export const directoryEntityCardVariantsReduced = entityCardVariantsReduced;
export type DirectoryEntityCardProps = EntityCardProps;

/**
 * Backward-compatible alias for unified EntityCard.
 */
export const DirectoryEntityCard = EntityCard;
