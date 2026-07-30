export function cleanTelUri(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
