/**
 * Format a date for display. Returns '—' for null/undefined.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '\u2014';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Build a display name from first + last name. Returns 'Unknown' if both empty.
 */
export function displayName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}

/**
 * Truncate a string to maxLen characters with ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}
