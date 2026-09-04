export const EMPTY_FORMATTED_VALUE = '—';

function parseValidDate(value: Date | string | null | undefined): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDate(value: Date | string | null | undefined, locale = 'en-GB'): string {
  const parsed = parseValidDate(value);

  if (!parsed) {
    return EMPTY_FORMATTED_VALUE;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  } catch {
    return EMPTY_FORMATTED_VALUE;
  }
}

export function formatDateTime(value: Date | string | null | undefined, locale = 'en-GB'): string {
  const parsed = parseValidDate(value);

  if (!parsed) {
    return EMPTY_FORMATTED_VALUE;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
    }).format(parsed);
  } catch {
    return EMPTY_FORMATTED_VALUE;
  }
}
