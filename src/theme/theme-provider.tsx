import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { AppPalette, getPalette } from '@/theme/theme';
import {
  ThemePreference,
  getStoredThemePreference,
  saveStoredThemePreference,
} from '@/theme/theme-store';

type ThemeScheme = 'light' | 'dark';

type ThemeContextValue = {
  colors: AppPalette;
  scheme: ThemeScheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    getStoredThemePreference().then((stored) => {
      if (active && stored) {
        setPreferenceState(stored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function setPreference(pref: ThemePreference) {
    setPreferenceState(pref);
    void saveStoredThemePreference(pref);
  }

  const scheme: ThemeScheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: getPalette(scheme), scheme, preference, setPreference }),
    [scheme, preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useColors(): AppPalette {
  return useAppTheme().colors;
}
