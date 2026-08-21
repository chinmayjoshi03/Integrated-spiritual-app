import { use, createContext, useState, type PropsWithChildren } from 'react';

import { useStorageState } from './useStorageState';
import { apiLogin, apiSignup, apiGetProfile, type User } from '@/services/api';

type AuthContextType = {
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => void;
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
 * Provides auth state (session token, user info) to the entire app.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [user, setUser] = useState<User | null>(null);

  /**
   * Sign in with email and password.
   * Returns null on success, or an error message string on failure.
   */
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await apiLogin(email, password);

    if (error || !data) {
      return error || 'Login failed.';
    }

    setSession(data.token);
    setUser(data.user);
    return null;
  };

  /**
   * Create a new account.
   * Returns null on success, or an error message string on failure.
   */
  const signUp = async (name: string, email: string, password: string): Promise<string | null> => {
    const { data, error } = await apiSignup(name, email, password);

    if (error || !data) {
      return error || 'Signup failed.';
    }

    setSession(data.token);
    setUser(data.user);
    return null;
  };

  /**
   * Clear the session and user data.
   */
  const signOut = () => {
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        signOut,
        session,
        user,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
