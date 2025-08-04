'use client';

import { useTheme } from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';

export default function ThemeTestPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Theme Test Page
        </h1>
        
        {/* Theme Controls */}
        <div className="bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Theme Controls</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Toggle Button:</span>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="font-medium">Select Dropdown:</span>
              <ThemeToggle variant="select" />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="font-medium">Direct Buttons:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded ${
                    theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded ${
                    theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`px-3 py-1 rounded ${
                    theme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Status */}
        <div className="bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Theme Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-tremor-background dark:bg-dark-tremor-background rounded border">
              <div className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                Selected Theme
              </div>
              <div className="text-lg font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {theme}
              </div>
            </div>
            <div className="p-4 bg-tremor-background dark:bg-dark-tremor-background rounded border">
              <div className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                Resolved Theme
              </div>
              <div className="text-lg font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {resolvedTheme}
              </div>
            </div>
            <div className="p-4 bg-tremor-background dark:bg-dark-tremor-background rounded border">
              <div className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                System Preference
              </div>
              <div className="text-lg font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Theme Test */}
        <div className="bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Visual Theme Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-tremor-background dark:bg-dark-tremor-background p-4 rounded-lg border border-tremor-border dark:border-dark-tremor-border">
              <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong mb-2">
                Sample Card
              </h3>
              <p className="text-tremor-content dark:text-dark-tremor-content mb-3">
                This is a sample card to test theme colors and contrast.
              </p>
              <button className="bg-tremor-brand dark:bg-dark-tremor-brand text-tremor-brand-inverted dark:text-dark-tremor-brand-inverted px-3 py-1 rounded text-sm">
                Action Button
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-tremor-card dark:shadow-dark-tremor-card">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Standard Colors
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Using standard Tailwind colors for comparison.
              </p>
              <div className="flex gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-tremor-brand-faint to-tremor-brand-muted dark:from-dark-tremor-brand-faint dark:to-dark-tremor-brand-muted p-4 rounded-lg">
              <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong mb-2">
                Gradient Card
              </h3>
              <p className="text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis mb-3">
                Testing gradient backgrounds with theme colors.
              </p>
              <div className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-sm">
                Subtle text content
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            Testing Instructions
          </h2>
          <div className="space-y-2 text-yellow-700 dark:text-yellow-300">
            <p><strong>1. Light Mode:</strong> Click the theme toggle to set to light mode. All backgrounds should be light.</p>
            <p><strong>2. Dark Mode:</strong> Click the theme toggle to set to dark mode. All backgrounds should be dark.</p>
            <p><strong>3. System Mode:</strong> Click the theme toggle to set to system mode. The theme should match your OS preference.</p>
            <p><strong>4. System Changes:</strong> With system mode active, change your OS theme preference. The app should update automatically.</p>
            <p><strong>5. Persistence:</strong> Refresh the page. Your theme selection should persist and load correctly without flashing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}