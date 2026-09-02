import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sharedSrc = path.resolve(__dirname, '../../packages/shared/src');

function extractTranslations(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^\s*"([^"]+)":\s*"(.*)",?$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

const en = extractTranslations(path.join(sharedSrc, 'appTranslationsEn.ts'));
const ar = extractTranslations(path.join(sharedSrc, 'appTranslationsAr.ts'));
const ur = extractTranslations(path.join(sharedSrc, 'appTranslationsUr.ts'));
const fa = extractTranslations(path.join(sharedSrc, 'appTranslationsFa.ts'));

function isInvariantValue(key: string, value: string): boolean {
  if (value === '—' || value === '%') return true;
  if (value.endsWith('.csv') || value.endsWith('.vcf')) return true;
  if (/^https?:\/\//.test(value)) return true;
  if (/^[\d\s+\-•#]+$/.test(value)) return true;
  if (value.includes('@') && !value.includes(' ')) return true;
  if (/^\{[a-zA-Z]+\}$/.test(value)) return true;
  if (/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+$/.test(value)) return true;
  if (
    [
      'WhatsApp',
      'SMS',
      'IP',
      '2FA',
      'GR',
      'ISBN',
      'URL',
      'MCQ',
      'PDF',
      'ISO 8601',
      'GSM 7-bit',
      'Arial',
      'Georgia',
      'Monospace',
      'Serif',
      'AsyncLocalStorage',
      'Fastify WebSocket',
      'PostgreSQL 16 (RLS)',
      'Node.js RSS',
      'RLS 100%',
      'Madrasa MS',
      'Apple Contacts',
      'Google Contacts',
      'Gmail / Google Workspace',
      'iCloud Mail',
      'Microsoft 365',
      'Outlook.com / Hotmail',
      'Yahoo Mail',
      'Zoho Mail',
      'Client ID',
      'Client Secret',
      'Top P',
      'Facebook',
      'KB',
      'syed, syeda',
      '(vCard / .vcf)',
      'al-noor',
      '09:00 - 11:00',
    ].includes(value)
  ) {
    return true;
  }
  if (
    value.startsWith('SMS (') ||
    value.startsWith('WhatsApp (') ||
    value.startsWith('ISBN {') ||
    value.startsWith('¶ {') ||
    value.startsWith('{prefix}-') ||
    value.startsWith(' · ') ||
    value.includes('{quote}') ||
    value.includes('{className}') ||
    value.includes('{stage}')
  ) {
    return true;
  }
  return false;
}

let arMissing = 0;
let urMissing = 0;
let faMissing = 0;

for (const [key, enValue] of Object.entries(en)) {
  const invariant = isInvariantValue(key, enValue);
  if (!ar[key] || (!invariant && ar[key] === enValue)) arMissing++;
  if (!ur[key] || (!invariant && ur[key] === enValue)) urMissing++;
  if (!fa[key] || (!invariant && fa[key] === enValue)) faMissing++;
}

console.log('=== MMS Translation Completeness Report ===');
console.log(`Total Keys: ${Object.keys(en).length}`);
console.log(`Arabic (ar) fallback to EN / missing: ${arMissing}`);
console.log(`Urdu (ur) fallback to EN / missing: ${urMissing}`);
console.log(`Farsi (fa) fallback to EN / missing: ${faMissing}`);
