'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Helper function to get system theme preference
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Helper function to resolve theme to actual theme
function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme'
}: ThemeProviderProps) {
  // Initialize with proper theme resolution to prevent hydration mismatch
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored && ['dark', 'light', 'system'].includes(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }
    
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return resolveTheme(theme);
  });

  // Handle theme changes and apply to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = resolveTheme(theme);
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    // Add the resolved theme class
    root.classList.add(resolved);
    
    setResolvedTheme(resolved);
    
    // Store theme preference in localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme, storageKey]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      const root = window.document.documentElement;
      
      // Update DOM immediately
      root.classList.remove('light', 'dark');
      root.classList.add(newSystemTheme);
      
      // Update state
      setResolvedTheme(newSystemTheme);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    resolvedTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}