/** Contact domain entity types (person model + related value objects). */

/** Status of WhatsApp registration checks for phone numbers. */
export const WHATSAPP_STATUS_VALUES = ['PENDING', 'REGISTERED', 'NOT_REGISTERED', 'FAILED'] as const;

/** Status of WhatsApp registration checks for phone numbers. */
export type WhatsAppStatus = (typeof WHATSAPP_STATUS_VALUES)[number];

/** Phone number model for contacts with label, country code, and verification status. */
export interface PhoneNumber {
  label: string;
  number: string;
  countryCode?: string;
  isPrimary?: boolean;
  whatsappStatus?: WhatsAppStatus;
}

/** Email address model for contacts with verification state and primary flag. */
export interface EmailAddress {
  label: string;
  address: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

/** Physical address model for contacts. */
export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
  isPrimary?: boolean;
}

/** Social profile link model for contacts. */
export interface SocialLink {
  platform: string;
  url: string;
}

/** Linked contact entry for the Relationship form tab (reciprocal graph). */
export interface RelationshipContact {
  name?: string;
  relationship?: string;
  phone?: string;
  contactId?: string | number;
  inferred?: boolean;
  inferredFromContactId?: string;
  inferenceDepth?: number;
}

/** Inter-contact relationship reference link. */
export interface ContactRelationship {
  contactId: string | number;
  relationship?: string;
  notes?: string;
}

/** Definition for a 2-sided reciprocal relationship pair. */
export interface RelationshipPair {
  id?: string;
  forward: string;
  inverse: string;
  inverseMale?: string;
  inverseFemale?: string;
}

/** Audit log activity item recorded on a contact timeline. */
export interface ContactActivity {
  id: string;
  type: "note" | "stage_change" | "whatsapp" | "email" | "system" | "task" | "call";
  content: string;
  date: string;
  by?: string;
  metadata?: Record<string, unknown>;
}

/** Document attachment associated with a contact record. */
export interface ContactAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  date: string;
}

/** Primary domain model representing a Contact entity across the monorepo. */
export interface Contact {
  id: string | number;
  name: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  cnic?: string;
  isSyed?: boolean;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;

  // Communication & Preference Extensions
  preferredLanguage?: 'en' | 'ur' | 'ar' | 'fa';
  preferredContactMethod?: 'whatsapp' | 'sms' | 'email' | 'phone_call';
  doNotContact?: boolean;

  phones?: PhoneNumber[];
  emails?: EmailAddress[];
  addresses?: Address[];
  socials?: SocialLink[];
  relationshipContacts?: RelationshipContact[];
  relationships?: ContactRelationship[];
  activities?: ContactActivity[];
  attachments?: ContactAttachment[];
  aiSummary?: string;
  [key: string]: unknown;
}
