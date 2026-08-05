/**
 * Stable barrel — pure relationship rules live in `@mms/shared`.
 * Keep this path for existing backend service imports.
 */
export {
  ROLE_BY_TERM,
  PRIMARY_TRIGGER_ROLES,
  DIRECT_RELATIONSHIP_PRIORITY,
  INFERRED_RELATIONSHIP_PRIORITY,
  RELATIONSHIP_INFERENCE_RULES,
  RELATIONSHIP_INFERENCE_RULE_BY_PATH,
  normalizeRelationshipTerm,
  relationshipRole,
  relationshipLabel,
  inverseRole,
  composeRelationship,
  resolveInverseRelationship,
  type RelationshipRole,
  type RelationshipLink,
  type PlannedRelationship,
  type RelationshipInferenceRule,
} from '@mms/shared';
