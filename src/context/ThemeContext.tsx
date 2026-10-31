import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDb } from '../db/database';

export type AppTheme = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  chipBg: string;
  primary: string;
  primaryLight: string;
  success: string;
  danger: string;
  warning: string;
}

export const DARK_THEME: ThemeColors = {
  background: '#020617',
  card: '#0F172A',
  cardBorder: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  inputBg: '#1E293B',
  chipBg: '#1E293B',
  primary: '#38BDF8',
  primaryLight: '#0C4A6E',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export const LIGHT_THEME: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  inputBg: '#F1F5F9',
  chipBg: '#F1F5F9',
  primary: '#0284C7',
  primaryLight: '#E0F2FE',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
};

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setTheme: (newTheme: AppTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('dark');

  // Cargar tema guardado en SQLite
  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const row = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM app_settings WHERE key = 'app_theme'"
        );
        if (row && (row.value === 'light' || row.value === 'dark')) {
          setThemeState(row.value as AppTheme);
        }
      } catch {}
    })();
  }, []);

  const setTheme = useCallback(async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      const db = await getDb();
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('app_theme', ?)",
        [newTheme]
      );
    } catch {}
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(nextTheme);
  }, [theme, setTheme]);

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return ctx;
}

