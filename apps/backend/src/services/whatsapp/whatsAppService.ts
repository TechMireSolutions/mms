import { fetchCollection, persistCollection, fetchObject } from '../dbSyncService.js';
import { whatsAppQueue, Task } from './whatsAppQueue.js';
import { PuppeteerWhatsAppProvider } from './whatsAppProvider.js';
import type { Contact, PhoneNumber, WhatsAppPreferences, WhatsAppVerificationResult } from '@mms/shared';

const provider = new PuppeteerWhatsAppProvider();

// Default fallback preferences if none exist in the database configuration
const DEFAULT_PREFERENCES: WhatsAppPreferences = {
  autoCheckEnabled: true,
  excludedCountryCodes: ['+1', '+44'],
  verificationTrigger: 'IMMEDIATE_ON_SAVE',
  uiIndicatorStyle: {
    icon: 'CheckCircle',
    color: 'hsl(var(--primary))',
    label: 'WhatsApp Active'
  }
};

/**
 * Retrieves the WhatsApp preferences from system configuration.
 */
export async function getWhatsAppPreferences(): Promise<WhatsAppPreferences> {
  try {
    const config = await fetchObject('whatsapp_preferences');
    if (!config) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(config as Partial<WhatsAppPreferences>) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[whatsapp] Failed to load preferences; using defaults:', message);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Normalizes and returns the complete international phone number digits (code + local number).
 */
export function getFullPhoneDigits(phone: PhoneNumber | undefined): string | null {
  if (!phone) return null;
  const code = phone.countryCode ? phone.countryCode.replace(/\D/g, '') : '';
  let num = phone.number ? phone.number.replace(/\D/g, '') : '';
  if (!num) return null;

  // Strip leading zeros from the local number if we have a country code
  if (code && num.startsWith('0')) {
    num = num.replace(/^0+/, '');
  }

  // If the number already starts with the country code, do not prepend it
  if (code && num.startsWith(code)) {
    return num;
  }

  return `${code}${num}`;
}

/**
 * Evaluation rules check: determine if validation criteria are satisfied.
 */
export function shouldVerify(contact: Contact, prefs: WhatsAppPreferences): boolean {
  if (!prefs.autoCheckEnabled) return false;
  if (!contact.phones || contact.phones.length === 0) return false;

  const fullPhone = getFullPhoneDigits(contact.phones[0]);
  if (!fullPhone) return false;

  // Evaluate if number starts with any of the excluded prefixes
  const hasExcludedPrefix = prefs.excludedCountryCodes.some((code) => {
    const cleanCode = code.replace(/\D/g, '');
    return fullPhone.startsWith(cleanCode);
  });

  if (hasExcludedPrefix) return false;
  return true;
}

/**
 * Processes a queued task: checks registration and updates the contact database record.
 */
async function processTask(task: Task): Promise<void> {
  const { contactId, phoneNumber } = task.data;
  const result: WhatsAppVerificationResult = await provider.verifyPhoneNumber(phoneNumber);

  const contactsData = await fetchCollection('contacts');
  if (!contactsData) return;

  const contacts = contactsData as Contact[];
  const index = contacts.findIndex((c) => String(c.id) === String(contactId));
  if (index === -1) return;

  contacts[index] = {
    ...contacts[index],
    whatsappStatus: result.status,
    lastCheckedAt: result.checkedAt
  };

  await persistCollection('contacts', contacts);
}

// Attach the processor to our background task execution queue
whatsAppQueue.setProcessor(processTask);

/**
 * Save/Update interception: hooks into save events to schedule checks asynchronously.
 */
export async function handleContactSaveOrUpdate(contact: Contact): Promise<void> {
  const prefs = await getWhatsAppPreferences();
  
  if (!shouldVerify(contact, prefs)) {
    return;
  }

  // Get combined international phone digits to check
  const phone = contact.phones?.[0];
  const fullPhone = getFullPhoneDigits(phone);
  if (!fullPhone) return;

  if (prefs.verificationTrigger === 'IMMEDIATE_ON_SAVE') {
    whatsAppQueue.addJob(contact.id, fullPhone);
  }
}
