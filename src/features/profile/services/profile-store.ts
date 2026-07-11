import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PROFILE_KEY = 'portibilify.profile';

export type UserProfile = {
  phone: string;
  location: string;
};

export const EMPTY_PROFILE: UserProfile = {
  phone: '',
  location: '',
};

export async function getStoredProfile(): Promise<Partial<UserProfile> | null> {
  const raw = await readStorage(PROFILE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      location: typeof parsed.location === 'string' ? parsed.location : '',
    };
  } catch {
    return null;
  }
}

export async function saveStoredProfile(profile: UserProfile): Promise<void> {
  await writeStorage(PROFILE_KEY, JSON.stringify(profile));
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
