import { use, createContext, useRef, useState, useEffect, type PropsWithChildren } from 'react';

import { useStorageState } from './useStorageState';
import { apiLogin, apiSignup, apiVerifyOtp, BASE_URL, type User } from '@/services/api';
import { loadProfilePhoto } from './profile-photo';

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
};

const MOBILE_ROLES = ['user', 'mentor'];
const WEBSITE_ONLY_MESSAGE = 'Administrator accounts sign in on the website. The app is for members only.';

/** Backend returns user_category on /users/me and userCategory on login — accept both. */
/** /auth/login returns camelCase, /users/me returns snake_case — accept both. */
function normaliseUser(raw: User & { phone_number?: string | null; date_of_birth?: string | null }): User {
  const phoneNumber = raw.phoneNumber ?? raw.phone_number ?? null;
  const dateOfBirth = raw.dateOfBirth ?? raw.date_of_birth ?? null;
  return {
    ...raw,
    userCategory: raw.userCategory ?? raw.user_category ?? 'normal',
    phoneNumber,
    dateOfBirth,
    profileComplete: raw.profileComplete ?? Boolean(phoneNumber && dateOfBirth),
  };
}

type AuthContextType = {
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (payload: SignUpPayload) => Promise<{ error: string | null; email: string | null }>;
  /** Complete registration by verifying the OTP; signs in when the password from sign-up is still in memory. */
  verifyOtp: (email: string, code: string) => Promise<{ error: string | null; signedIn: boolean }>;
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
        if (data?.user && MOBILE_ROLES.includes(data.user.role)) {
          setUser(normaliseUser(data.user));
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

  const pendingCredentials = useRef<{ email: string; password: string } | null>(null);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await apiLogin(email.trim(), password);
    if (error || !data) return error || 'Login failed. Please check your credentials.';
    // Admin sign-in needs an emailed OTP and is website-only.
    if (data.requiresOtp || (data.user && !MOBILE_ROLES.includes(data.user.role))) {
      return WEBSITE_ONLY_MESSAGE;
    }
    if (!data.token || !data.user) return 'Login failed. Please try again.';
    setSession(data.token);
    setUser(normaliseUser(data.user));
    return null;
  };

  /**
   * Register a new account. The backend sends an OTP to the email.
   * On success returns { error: null, email } — navigate to OTP screen.
   */
  const signUp = async (
    payload: SignUpPayload
  ): Promise<{ error: string | null; email: string | null }> => {
    const { data, error } = await apiSignup({
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phoneNumber: payload.phoneNumber.trim(),
    });
    if (error || !data) return { error: error || 'Signup failed. Please try again.', email: null };
    // Kept in memory only, so the user is signed in straight after verifying the email.
    pendingCredentials.current = { email: data.email ?? payload.email.trim(), password: payload.password };
    return { error: null, email: data.email };
  };

  /**
   * Verify OTP after registration. On success, session is set and user is logged in.
   */
  const verifyOtp = async (email: string, code: string): Promise<{ error: string | null; signedIn: boolean }> => {
    const { data, error } = await apiVerifyOtp(email, code);
    if (error || !data) return { error: error || 'Verification failed. Please try again.', signedIn: false };
    // /auth/verify-otp only confirms the email (no token) — sign in with the sign-up password.
    if (data.token && data.user) {
      setSession(data.token);
      setUser(normaliseUser(data.user));
      return { error: null, signedIn: true };
    }
    const creds = pendingCredentials.current;
    pendingCredentials.current = null;
    if (!creds || creds.email.toLowerCase() !== email.trim().toLowerCase()) return { error: null, signedIn: false };
    const loginError = await signIn(creds.email, creds.password);
    return { error: null, signedIn: !loginError };
  };

  const signOut = () => {
    setSession(null);
    setUser(null);
  };

  // Keep the locally stored profile photo in sync with whoever is signed in.
  useEffect(() => {
    void loadProfilePhoto(user?.id ?? null);
  }, [user?.id]);

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
