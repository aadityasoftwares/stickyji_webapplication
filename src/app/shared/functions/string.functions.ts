/**
 * Builds a compact uppercase initials label from a display name or email.
 */
export function getInitials(value: unknown, fallback = 'U'): string {
  try {
    const text = String(value ?? '').trim();
    if (!text) {
      return fallback.slice(0, 2).toUpperCase();
    }

    const source = text.includes('@') ? text.split('@')[0] : text;
    const parts = source
      .split(/[\s._-]+/)
      .map(part => part.trim())
      .filter(Boolean);

    const initials = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : source.slice(0, 2);

    return (initials || fallback).toUpperCase();
  } catch (error) {
    console.error('Error in getInitials:', error);
    return fallback.slice(0, 2).toUpperCase();
  }
}
export function humanize(value: unknown, separators: RegExp = /_/g): string {
  const text = String(value ?? '').trim().toLowerCase().replace(separators, ' ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '—';
}
