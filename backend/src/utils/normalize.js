export const clean = (value) => String(value ?? '').trim();
export const normalizeCode = (value) => clean(value).replace(/\s+/g, '').toUpperCase();
export const normalizeHeader = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
