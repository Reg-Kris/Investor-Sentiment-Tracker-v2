/**
 * ThemeScript - Prevents flash of incorrect theme on page load
 * This script runs before React hydrates to set the correct theme class
 */
export function ThemeScript({ storageKey = 'theme' }: { storageKey?: string }) {
  const script = `
    (function() {
      try {
        function getSystemTheme() {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        function resolveTheme(theme) {
          if (theme === 'system') return getSystemTheme();
          return theme;
        }
        
        // Get stored theme or default to 'system'
        let theme = 'system';
        try {
          const stored = localStorage.getItem('${storageKey}');
          if (stored && ['dark', 'light', 'system'].includes(stored)) {
            theme = stored;
          }
        } catch (e) {
          console.warn('Failed to read theme from localStorage:', e);
        }
        
        // Resolve and apply theme
        const resolvedTheme = resolveTheme(theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolvedTheme);
        
        // Store the theme value for consistency
        try {
          localStorage.setItem('${storageKey}', theme);
        } catch (e) {
          console.warn('Failed to save theme to localStorage:', e);
        }
      } catch (error) {
        console.error('Theme script error:', error);
        // Fallback to dark theme
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}