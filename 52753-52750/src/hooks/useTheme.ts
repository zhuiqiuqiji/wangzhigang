import { useState, useEffect, useCallback } from 'react';
import { Theme } from '@/types/game';
import { themes, getThemeById, applyTheme } from '@/data/themes';

const STORAGE_KEY = 'rhythm-master-theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        return getThemeById(savedId);
      }
    }
    return themes[0];
  });
  
  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem(STORAGE_KEY, currentTheme.id);
  }, [currentTheme]);
  
  const setTheme = useCallback((themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
  }, []);
  
  const resetTheme = useCallback(() => {
    setCurrentTheme(themes[0]);
  }, []);
  
  return {
    theme: currentTheme,
    themes,
    setTheme,
    resetTheme,
  };
}
