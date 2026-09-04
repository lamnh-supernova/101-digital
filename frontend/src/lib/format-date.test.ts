import { EMPTY_FORMATTED_VALUE, formatDate, formatDateTime } from './format-date';

describe('formatDate', () => {
  it('formats a date-only string in en-GB order', () => {
    expect(formatDate('2026-01-10')).toBe('10 Jan 2026');
  });

  it('formats a Date instance directly', () => {
    expect(formatDate(new Date(Date.UTC(2026, 0, 10)))).toBe('10 Jan 2026');
  });

  it('returns the empty-value placeholder for null, undefined, and invalid values', () => {
    expect(formatDate(null)).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatDate(undefined)).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatDate('not-a-date')).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatDate(new Date('invalid'))).toBe(EMPTY_FORMATTED_VALUE);
  });
});

describe('formatDateTime', () => {
  it('formats a standard ISO 8601 UTC timestamp in en-GB 24-hour form', () => {
    expect(formatDateTime('2026-01-11T15:03:08.997Z')).toContain('11 Jan 2026');
    expect(formatDateTime('2026-01-11T15:03:08.997Z')).toContain('15:03');
  });

  it('returns the empty-value placeholder for null, undefined, and invalid values', () => {
    expect(formatDateTime(null)).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatDateTime(undefined)).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatDateTime('not-a-timestamp')).toBe(EMPTY_FORMATTED_VALUE);
  });
});
