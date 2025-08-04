'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'select';
}

export default function ThemeToggle({ 
  className,
  size = 'md',
  variant = 'button'
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'select') {
    return (
      <div className={clsx('relative', className)}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className={clsx(
            'appearance-none bg-tremor-background dark:bg-dark-tremor-background',
            'border border-tremor-border dark:border-dark-tremor-border',
            'rounded-lg px-3 py-2 pr-8 text-sm',
            'text-tremor-content-strong dark:text-dark-tremor-content-strong',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
            'cursor-pointer transition-colors duration-200'
          )}
          aria-label="Select theme"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-4 w-4 text-tremor-content dark:text-dark-tremor-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Light mode' },
    { value: 'dark', icon: Moon, label: 'Dark mode' },
    { value: 'system', icon: Monitor, label: 'System preference' }
  ];

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value as any);
  };

  const currentTheme = themes.find(t => t.value === theme);
  const Icon = currentTheme?.icon || Sun;

  return (
    <button
      onClick={cycleTheme}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-lg',
        'bg-tremor-background dark:bg-dark-tremor-background',
        'border border-tremor-border dark:border-dark-tremor-border',
        'text-tremor-content-strong dark:text-dark-tremor-content-strong',
        'hover:bg-tremor-background-subtle dark:hover:bg-dark-tremor-background-subtle',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
        'transition-all duration-200 transform hover:scale-105 active:scale-95',
        sizeClasses[size],
        className
      )}
      aria-label={`Current theme: ${currentTheme?.label}. Click to cycle themes.`}
      title={currentTheme?.label}
    >
      <Icon className={iconSizes[size]} />
      
      {/* Theme indicator */}
      <div className="absolute -top-1 -right-1">
        <div className={clsx(
          'w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
          resolvedTheme === 'light' ? 'bg-yellow-400' : 'bg-blue-600'
        )} />
      </div>
    </button>
  );
}