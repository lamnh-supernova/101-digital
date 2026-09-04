/** @jest-environment jsdom */
import { clearStoredAuth, readStoredAuth, writeStoredAuth, type StoredAuth } from './auth-storage';

const auth: StoredAuth = {
  accessToken: 'TEST_ONLY_TOKEN',
  user: { id: '1', email: 'reviewer@simpleinvoice.test', fullname: 'Reviewer' },
};

describe('auth-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a stored session', () => {
    writeStoredAuth(auth);
    expect(readStoredAuth()).toEqual(auth);
  });

  it('returns undefined when nothing is stored', () => {
    expect(readStoredAuth()).toBeUndefined();
  });

  it('returns undefined for malformed JSON rather than throwing', () => {
    window.localStorage.setItem('simpleinvoice.auth', 'not-json');
    expect(readStoredAuth()).toBeUndefined();
  });

  it('returns undefined for well-formed JSON missing the expected shape', () => {
    window.localStorage.setItem('simpleinvoice.auth', JSON.stringify({ foo: 'bar' }));
    expect(readStoredAuth()).toBeUndefined();
  });

  it('clears the stored session', () => {
    writeStoredAuth(auth);
    clearStoredAuth();
    expect(readStoredAuth()).toBeUndefined();
  });
});
