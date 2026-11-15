/**
 * Device-level preferences (the website keeps these in localStorage).
 * Stored in SecureStore on native and localStorage on web.
 */
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export type AppPreferences = {
  showOnlineEventsFirst: boolean;
};

const KEY = 'app_preferences_v1';
const DEFAULTS: AppPreferences = { showOnlineEventsFirst: false };

let current: AppPreferences = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(KEY); } catch { return null; }
  }
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string) {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await read();
    if (raw) current = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    current = DEFAULTS;
  }
  listeners.forEach((l) => l());
}

export async function updateAppPreferences(patch: Partial<AppPreferences>) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
  await write(JSON.stringify(current));
}

export function useAppPreferences(): AppPreferences {
  void ensureLoaded();
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current
  );
}
