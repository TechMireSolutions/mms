import type {
  Address,
  Contact,
  ContactBankDetail,
  ContactEducation,
  ContactExperience,
  ContactSkill,
  EmailAddress,
  PhoneNumber,
  RelationshipContact,
  SocialLink,
} from './contactEntityTypes.js';
import { parseCsvRows } from './csvParserCore.js';

export { parseCsvRows };

export interface ParseContactsCsvOptions {
  defaultPhoneLabel?: string;
  defaultEmailLabel?: string;
  defaultAddressLabel?: string;
}

function normalizeHeaderKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const HEADER_ALIASES: Record<string, string[]> = {
  firstName: ['firstname', 'first', 'first_name'],
  lastName: ['lastname', 'last', 'last_name'],
  name: ['name', 'fullname', 'full_name'],
  gender: ['gender'],
  dob: ['dob', 'dateofbirth', 'birthdate'],
  cnic: ['cnic', 'nationalid', 'cnicnationalid'],
  isSyed: ['issyed', 'syed'],
  tag: ['tag', 'tags'],
  notes: ['notes', 'note'],
  phone_label: ['phonetype', 'phonelabel'],
  phone_number: ['phone', 'phonenumber', 'mobile'],
  email_label: ['emailtype', 'emaillabel'],
  email_address: ['email', 'emailaddress'],
  address_label: ['addresstype', 'addresslabel'],
  line1: ['streetaddress', 'street', 'line1', 'address'],
  city: ['city'],
  state: ['state', 'stateprovince', 'province'],
  country: ['country'],
  socials_platform: ['socialplatform', 'socialplatforms'],
  socials_url: ['socialurl', 'sociallinks'],
  education_degree: ['degree', 'qualification', 'degreequalification'],
  education_institution: ['institution', 'school', 'university'],
  education_fieldOfStudy: ['fieldofstudy', 'field', 'major'],
  education_year: ['graduationyear', 'passingyear', 'year'],
  education_grade: ['gradescore', 'grade', 'score'],
  experience_title: ['jobtitle', 'title'],
  experience_organization: ['organization', 'employer', 'company'],
  experience_employmentType: ['employmenttype'],
  experience_location: ['joblocation', 'location'],
  experience_startDate: ['jobstartdate', 'startdate'],
  experience_endDate: ['jobenddate', 'enddate'],
  experience_isCurrent: ['currentlyworkinghere', 'iscurrent'],
  experience_description: ['jobdescription', 'description'],
  skills_name: ['skillname', 'skill', 'skills'],
  skills_category: ['skillcategory', 'category'],
  skills_proficiency: ['skillproficiency', 'proficiencylevel', 'proficiency'],
  skills_yearsOfExperience: ['yearsofexperience', 'experienceyears'],
  skills_isCertified: ['certified'],
  skills_issuer: ['certifyingbodyissuer', 'issuedby', 'issuer'],
  skills_description: ['skillnotes'],
  relationship_contact: ['relationshipcontact'],
  relationship_type: ['relationshiptype', 'relationship'],
  bank_name: ['bankname'],
  bank_accountTitle: ['bankaccounttitle', 'accounttitle'],
  bank_accountNumber: ['bankaccountnumber', 'accountnumber', 'accountnumberiban', 'iban'],
};

export const HEADER_FIELD_MAP: Record<string, string> = {};
for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
  for (const alias of aliases) {
    HEADER_FIELD_MAP[alias] = field;
  }
}

function splitList(val: string | undefined): string[] {
  if (!val) return [];
  return val.split(';').map((s) => s.trim());
}

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  const s = val.trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'y';
}

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cleanCell(val: string): string {
  const trimmed = val.trim();
  if (trimmed.startsWith("'") && /^[=+\-@\t\r]/.test(trimmed.slice(1))) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

/**
 * Parses CSV text into an array of Contact objects across all 10 contact tabs.
 */
export function parseContactsCsv(
  csvText: string,
  options?: ParseContactsCsvOptions,
): { contacts: Contact[]; errors: string[] } {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return { contacts: [], errors: rows.length === 0 ? ['CSV file is empty'] : ['CSV file has no data rows'] };
  }

  const headerRow = rows[0];
  const colMap = new Map<string, number>();
  for (let i = 0; i < headerRow.length; i++) {
    const raw = headerRow[i].trim();
    const fieldKey = HEADER_FIELD_MAP[normalizeHeaderKey(raw)] || raw;
    colMap.set(fieldKey, i);
  }

  const getVal = (row: string[], key: string): string => {
    const idx = colMap.get(key);
    return idx !== undefined && row[idx] !== undefined ? cleanCell(row[idx]) : '';
  };

  const contacts: Contact[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    let firstName = getVal(row, 'firstName');
    let lastName = getVal(row, 'lastName');
    const rawName = getVal(row, 'name');

    if (!firstName && !lastName && rawName) {
      const parts = rawName.split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ');
    }
    if (!firstName && !lastName) continue;

    const phoneNums = splitList(getVal(row, 'phone_number'));
    const phoneLabels = splitList(getVal(row, 'phone_label'));
    const phones: PhoneNumber[] = phoneNums.map((num, idx) => ({
      label: phoneLabels[idx] || phoneLabels[0] || options?.defaultPhoneLabel || 'Mobile',
      number: num,
      isPrimary: idx === 0,
    }));

    const emailAddrs = splitList(getVal(row, 'email_address'));
    const emailLabels = splitList(getVal(row, 'email_label'));
    const emails: EmailAddress[] = emailAddrs.map((addr, idx) => ({
      label: emailLabels[idx] || emailLabels[0] || options?.defaultEmailLabel || 'Personal',
      address: addr,
      isPrimary: idx === 0,
    }));

    const line1s = splitList(getVal(row, 'line1'));
    const cities = splitList(getVal(row, 'city'));
    const states = splitList(getVal(row, 'state'));
    const countries = splitList(getVal(row, 'country'));
    const addrLabels = splitList(getVal(row, 'address_label'));
    const addrCount = Math.max(line1s.length, cities.length, states.length, countries.length);
    const addresses: Address[] = Array.from({ length: addrCount }, (_, a) => ({
      label: addrLabels[a] || addrLabels[0] || options?.defaultAddressLabel || 'Home',
      line1: line1s[a] || '',
      city: cities[a] || '',
      state: states[a] || '',
      country: countries[a] || '',
      isPrimary: a === 0,
    }));

    const socPlatforms = splitList(getVal(row, 'socials_platform'));
    const socUrls = splitList(getVal(row, 'socials_url'));
    const socials: SocialLink[] = Array.from({ length: Math.max(socPlatforms.length, socUrls.length) }, (_, s) => ({
      platform: socPlatforms[s] || 'Other',
      url: socUrls[s] || '',
    })).filter((s) => s.url.length > 0 || s.platform !== 'Other');

    const eduInsts = splitList(getVal(row, 'education_institution'));
    const eduDegs = splitList(getVal(row, 'education_degree'));
    const eduFields = splitList(getVal(row, 'education_fieldOfStudy'));
    const eduYears = splitList(getVal(row, 'education_year'));
    const eduGrades = splitList(getVal(row, 'education_grade'));
    const education: ContactEducation[] = Array.from({ length: Math.max(eduInsts.length, eduDegs.length) }, (_, e) => ({
      institution: eduInsts[e] || '',
      degree: eduDegs[e] || '',
      fieldOfStudy: eduFields[e] || '',
      year: eduYears[e] || '',
      grade: eduGrades[e] || '',
    }));

    const expTitles = splitList(getVal(row, 'experience_title'));
    const expOrgs = splitList(getVal(row, 'experience_organization'));
    const expTypes = splitList(getVal(row, 'experience_employmentType'));
    const expLocs = splitList(getVal(row, 'experience_location'));
    const expStarts = splitList(getVal(row, 'experience_startDate'));
    const expEnds = splitList(getVal(row, 'experience_endDate'));
    const expCurrents = splitList(getVal(row, 'experience_isCurrent'));
    const expDescs = splitList(getVal(row, 'experience_description'));
    const experience: ContactExperience[] = Array.from({ length: Math.max(expTitles.length, expOrgs.length) }, (_, ex) => ({
      title: expTitles[ex] || '',
      organization: expOrgs[ex] || '',
      employmentType: expTypes[ex] || '',
      location: expLocs[ex] || '',
      startDate: expStarts[ex] || '',
      endDate: expEnds[ex] || '',
      isCurrent: parseBool(expCurrents[ex]),
      description: expDescs[ex] || '',
    }));

    const sklNames = splitList(getVal(row, 'skills_name'));
    const sklCats = splitList(getVal(row, 'skills_category'));
    const sklProfs = splitList(getVal(row, 'skills_proficiency'));
    const sklYears = splitList(getVal(row, 'skills_yearsOfExperience'));
    const sklCerts = splitList(getVal(row, 'skills_isCertified'));
    const sklIssuers = splitList(getVal(row, 'skills_issuer'));
    const sklDescs = splitList(getVal(row, 'skills_description'));
    const skills: ContactSkill[] = sklNames.map((skName, skIdx) => ({
      name: skName,
      category: sklCats[skIdx] || '',
      proficiency: sklProfs[skIdx] || '',
      yearsOfExperience: sklYears[skIdx] || '',
      isCertified: parseBool(sklCerts[skIdx]),
      issuer: sklIssuers[skIdx] || '',
      description: sklDescs[skIdx] || '',
    }));

    const relContacts = splitList(getVal(row, 'relationship_contact'));
    const relTypes = splitList(getVal(row, 'relationship_type'));
    const relationshipContacts: RelationshipContact[] = Array.from({ length: Math.max(relContacts.length, relTypes.length) }, (_, rc) => ({
      name: relContacts[rc] || '',
      relationship: relTypes[rc] || '',
    }));

    const bankNames = splitList(getVal(row, 'bank_name'));
    const bankTitles = splitList(getVal(row, 'bank_accountTitle'));
    const bankNums = splitList(getVal(row, 'bank_accountNumber'));
    const bankDetails: ContactBankDetail[] = Array.from({ length: Math.max(bankNames.length, bankNums.length) }, (_, b) => ({
      bankName: bankNames[b] || null,
      accountTitle: bankTitles[b] || null,
      accountNumber: bankNums[b] || null,
    }));

    contacts.push({
      id: generateId(),
      name: [firstName, lastName].filter(Boolean).join(' '),
      firstName,
      lastName,
      gender: getVal(row, 'gender'),
      dob: getVal(row, 'dob'),
      cnic: getVal(row, 'cnic'),
      isSyed: parseBool(getVal(row, 'isSyed')),
      tag: getVal(row, 'tag'),
      notes: getVal(row, 'notes'),
      phones,
      emails,
      addresses,
      socials,
      education,
      experience,
      skills,
      relationshipContacts,
      bankDetails,
    });
  }

  return { contacts, errors };
}
