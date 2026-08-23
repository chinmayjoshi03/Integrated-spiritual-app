import { Platform } from 'react-native';

// Use your machine's local IP when testing on a physical device via Expo Go.
// Change this IP if your network address changes (run: ipconfig getifaddr en0).
const LOCAL_IP = '10.19.201.190';
const BASE_URL = Platform.select({
  android: `http://${LOCAL_IP}:3001`,
  ios: `http://${LOCAL_IP}:3001`,
  default: 'http://localhost:3001',
});

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Something went wrong.' };
    }

    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

// ---- Auth API ----

export type User = {
  id: number;
  name: string | null;
  email: string;
  created_at: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

type ProfileResponse = {
  user: User;
};

export async function apiLogin(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSignup(name: string, email: string, password: string) {
  return request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiGetProfile(token: string) {
  return request<ProfileResponse>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
