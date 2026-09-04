'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError, apiRequest } from '@/lib/api-client';
import {
  clearStoredAuth,
  readStoredAuth,
  writeStoredAuth,
  type StoredAuth,
  type StoredAuthUser,
} from '@/lib/auth-storage';

export type AuthUser = StoredAuthUser;

interface LoginResponse {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly user: AuthUser;
}

export type LoginResult = { readonly ok: true } | { readonly ok: false; readonly message: string };

interface AuthContextValue {
  readonly user?: AuthUser;
  readonly accessToken?: string;
  readonly isLoading: boolean;
  readonly login: (email: string, password: string) => Promise<LoginResult>;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // localStorage is unavailable during SSR; hydrating here (rather than in
    // a lazy useState initializer) avoids a server/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuth(readStoredAuth());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      const nextAuth: StoredAuth = { accessToken: response.accessToken, user: response.user };
      writeStoredAuth(nextAuth);
      setAuth(nextAuth);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { ok: false, message: 'The email or password is incorrect.' };
      }

      if (error instanceof ApiError && error.status === 400) {
        return { ok: false, message: error.message };
      }

      return {
        ok: false,
        message: 'The sign-in service is temporarily unavailable. Please try again.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: auth?.user, accessToken: auth?.accessToken, isLoading, login, logout }),
    [auth, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
