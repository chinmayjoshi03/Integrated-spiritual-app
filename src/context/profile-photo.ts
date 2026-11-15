/**
 * Profile photo — stored locally on the device for now.
 *
 * The picked image is copied into the app's document directory and its path is
 * remembered in SecureStore, keyed by user id. Nothing is uploaded.
 *
 * TODO(S3): when the S3 bucket is ready, upload to POST /api/users/me/profile-picture
 * in `saveProfilePhoto`, and read `user.profile_picture_url` in `loadProfilePhoto`.
 * Screens only use `useProfilePhoto()`, so they won't need to change.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

let currentUserId: number | null = null;
let currentUri: string | null = null;
const listeners = new Set<() => void>();

const storageKey = (userId: number) => `profile_photo_${userId}`;

function emit(uri: string | null) {
  currentUri = uri;
  listeners.forEach((listener) => listener());
}

async function readKey(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function writeKey(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* ignore */ }
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

/** Call when the signed-in user changes (null on sign-out). */
export async function loadProfilePhoto(userId: number | null) {
  currentUserId = userId;
  if (!userId) {
    emit(null);
    return;
  }
  const uri = await readKey(storageKey(userId));
  if (uri && Platform.OS !== 'web') {
    const info = await FileSystem.getInfoAsync(uri).catch(() => null);
    emit(info?.exists ? uri : null);
    return;
  }
  emit(uri);
}

/** Copy a picked image into app storage and make it the current user's photo. */
export async function saveProfilePhoto(pickedUri: string) {
  if (!currentUserId) throw new Error('Not signed in.');
  let finalUri = pickedUri;
  if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
    const extension = pickedUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    // A new file name each time so expo-image doesn't show a cached old photo.
    finalUri = `${FileSystem.documentDirectory}profile-${currentUserId}-${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: pickedUri, to: finalUri });
    if (currentUri && currentUri !== finalUri) {
      await FileSystem.deleteAsync(currentUri, { idempotent: true }).catch(() => undefined);
    }
  }
  await writeKey(storageKey(currentUserId), finalUri);
  emit(finalUri);
}

export async function removeProfilePhoto() {
  if (!currentUserId) return;
  if (currentUri && Platform.OS !== 'web') {
    await FileSystem.deleteAsync(currentUri, { idempotent: true }).catch(() => undefined);
  }
  await writeKey(storageKey(currentUserId), null);
  emit(null);
}

export function useProfilePhoto(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentUri,
    () => currentUri
  );
}
