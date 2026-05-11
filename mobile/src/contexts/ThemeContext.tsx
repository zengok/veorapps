import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '../theme';

const THEME_KEY = '@veor_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'dark' || stored === 'light') setMode(stored);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = async (nextMode: ThemeMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const themeColors = mode === 'dark' ? darkColors : lightColors;
    return {
      mode,
      isDark: mode === 'dark',
      colors: themeColors,
      setThemeMode,
      toggleTheme: () => setThemeMode(mode === 'dark' ? 'light' : 'dark'),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
