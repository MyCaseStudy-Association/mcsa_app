import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const THEME_KEY = 'portibilify.theme';

export type ThemePreference = 'system' | 'light' | 'dark';

export async function getStoredThemePreference(): Promise<ThemePreference | null> {
  const raw = await readStorage(THEME_KEY);
  if (raw === 'system' || raw === 'light' || raw === 'dark') {
    return raw;
  }
  return null;
}

export async function saveStoredThemePreference(pref: ThemePreference): Promise<void> {
  await writeStorage(THEME_KEY, pref);
}

async function readStorage(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }
  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function writeStorage(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value);
  }
}

function getWebStorage() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}
