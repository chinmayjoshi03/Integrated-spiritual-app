import { use, createContext, useState, useEffect, type PropsWithChildren } from 'react';

import { useStorageState } from './useStorageState';
import { apiLogin, apiSignup, apiVerifyOtp, BASE_URL, type User } from '@/services/api';

type AuthContextType = {
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null; email: string | null }>;
  /** Complete registration by verifying the OTP. Returns null on success or an error string. */
  verifyOtp: (email: string, code: string) => Promise<string | null>;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  session?: string | null;
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook to access the auth session from any component.
 */
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

/**
 * Provides auth state (session token, user info) to the entire app connected to PostgreSQL.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [user, setUser] = useState<User | null>(null);

  // When a saved session is restored from storage, reload user profile from the backend
  useEffect(() => {
    if (!session) {
      setUser(null);
      return;
    }

    // Clean up any legacy demo bypass token
    if (session === 'demo-token-bypass') {
      setSession(null);
      setUser(null);
      return;
    }

    let isMounted = true;
    fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${session}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.user) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          setSession(null);
          setUser(null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [session, setSession]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await apiLogin(email.trim(), password);
    if (error || !data) return error || 'Login failed. Please check your credentials.';
    setSession(data.token);
    setUser(data.user);
    return null;
  };

  /**
   * Register a new account. The backend sends an OTP to the email.
   * On success returns { error: null, email } — navigate to OTP screen.
   */
  const signUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ error: string | null; email: string | null }> => {
    const { data, error } = await apiSignup(name.trim(), email.trim(), password);
    if (error || !data) return { error: error || 'Signup failed. Please try again.', email: null };
    return { error: null, email: data.email };
  };

  /**
   * Verify OTP after registration. On success, session is set and user is logged in.
   */
  const verifyOtp = async (email: string, code: string): Promise<string | null> => {
    const { data, error } = await apiVerifyOtp(email, code);
    if (error || !data) return error || 'Verification failed. Please try again.';
    setSession(data.token);
    setUser(data.user);
    return null;
  };

  const signOut = () => {
    setSession(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        verifyOtp,
        signOut,
        updateUser,
        session,
        user,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
