const STORAGE_KEY = 'simpleinvoice.auth';

export interface StoredAuthUser {
  readonly id: string;
  readonly email: string;
  readonly fullname: string;
}

export interface StoredAuth {
  readonly accessToken: string;
  readonly user: StoredAuthUser;
}

function isStoredAuth(value: unknown): value is StoredAuth {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.accessToken === 'string' && typeof candidate.user === 'object';
}

/** Reads the client-stored session. Token storage lives only in the browser, as specified. */
export function readStoredAuth(): StoredAuth | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      return undefined;
    }

    const parsed: unknown = JSON.parse(raw);
    return isStoredAuth(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
