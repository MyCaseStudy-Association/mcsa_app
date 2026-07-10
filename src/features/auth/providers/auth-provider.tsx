import React, { PropsWithChildren, createContext, useEffect, useMemo, useState } from 'react';

import {
  AUTH_API_BASE_URL,
  AuthApiError,
  AuthSession,
  AuthUser,
  clearAuthSession,
  getCurrentUser,
  getStoredAuthSession,
  login,
  LoginPayload,
  logout,
  refreshAuthSession,
  register,
  RegisterPayload,
  saveAuthSession,
} from '@/features/auth/services/auth-api';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  apiBaseUrl: string;
  signIn: (payload: LoginPayload) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<AuthSession>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedSession = await getStoredAuthSession();

      if (!storedSession) {
        if (isMounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser(storedSession.accessToken);
        await saveAuthSession({ ...storedSession, user: currentUser ?? storedSession.user });

        if (isMounted) {
          setUser(currentUser ?? storedSession.user ?? null);
          setStatus('authenticated');
        }
      } catch (error) {
        const refreshedSession = await refreshStoredSession(storedSession, error);

        if (isMounted) {
          setUser(refreshedSession?.user ?? null);
          setStatus(refreshedSession ? 'authenticated' : 'unauthenticated');
        }
      }
    }

    restoreSession().catch(async () => {
      await clearAuthSession();

      if (isMounted) {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      apiBaseUrl: AUTH_API_BASE_URL,
      signIn: async (payload) => {
        const session = await resolveSessionUser(await login(payload));
        setUser(session.user ?? null);
        setStatus('authenticated');
        return session;
      },
      signOut: async () => {
        setUser(null);
        setStatus('unauthenticated');

        try {
          await logout();
        } catch {
          await clearAuthSession();
        }
      },
      signUp: async (payload) => {
        const session = await resolveSessionUser(await register(payload));
        setUser(session.user ?? null);
        setStatus('authenticated');
        return session;
      },
      status,
      user,
    }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.use(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

async function resolveSessionUser(session: AuthSession) {
  if (session.user) {
    return session;
  }

  try {
    const user = await getCurrentUser(session.accessToken);
    const sessionWithUser = { ...session, user: user ?? undefined };
    await saveAuthSession(sessionWithUser);
    return sessionWithUser;
  } catch {
    return session;
  }
}

async function refreshStoredSession(storedSession: AuthSession, error: unknown) {
  if (!(error instanceof AuthApiError) || error.status !== 401) {
    await clearAuthSession();
    return null;
  }

  try {
    return await resolveSessionUser(await refreshAuthSession(storedSession.refreshToken));
  } catch {
    await clearAuthSession();
    return null;
  }
}
