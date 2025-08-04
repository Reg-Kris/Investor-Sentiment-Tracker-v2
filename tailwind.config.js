/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    transparent: 'transparent',
    current: 'currentColor',
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Custom breakpoints for laptop optimization
      'laptop': '1024px',
      'laptop-lg': '1440px',
    },
    extend: {
      colors: {
        // Soft Pink + Off-White Fintech Palette (2025 Design Trends)
        fintech: {
          primary: {
            50: '#FDF7FA',
            100: '#FBEEF4',
            200: '#F7DCE7',
            300: '#F0C2D4',
            400: '#E8A0BC',
            500: '#DE8EAC', // Soft dusty rose
            600: '#C7709A',
            700: '#A85A82',
            800: '#844567',
            900: '#5D3148',
          },
          secondary: {
            50: '#FEF9FB',
            100: '#FDF2F6',
            200: '#FBE4EB',
            300: '#F7CEDC',
            400: '#F2B0C8',
            500: '#F8B4C8', // Blush pink
            600: '#E895B5',
            700: '#D4749E',
            800: '#B85A82',
            900: '#904461',
          },
          accent: {
            50: '#F9F6F8',
            100: '#F2EBF0',
            200: '#E4D6DF',
            300: '#D1B8C8',
            400: '#BA94AB',
            500: '#CE93B3', // Mauve pink
            600: '#B67A9C',
            700: '#9A6483',
            800: '#7B5066',
            900: '#5A3A4A',
          },
          success: {
            50: '#F4F6F2',
            100: '#E7EBE2',
            200: '#CDD5C2',
            300: '#B0BC9E',
            400: '#93A386',
            500: '#93A386', // Sage green
            600: '#7F8F6F',
            700: '#697659',
            800: '#515C44',
            900: '#3A4130',
          },
          warning: {
            50: '#FEF9F6',
            100: '#FDF1E9',
            200: '#FBE1D0',
            300: '#F7CCB0',
            400: '#F2B088',
            500: '#F5B88E', // Soft peach
            600: '#E59E73',
            700: '#D18359',
            800: '#B36643',
            900: '#8F4E31',
          },
          error: {
            50: '#FDF6F7',
            100: '#FBEAED',
            200: '#F6D3D9',
            300: '#EEB4C0',
            400: '#E48FA1',
            500: '#EB8796', // Soft rose
            600: '#D66E82',
            700: '#BD5A6E',
            800: '#9A4758',
            900: '#733642',
          },
          surface: {
            light: '#FFFCF8', // Creamy off-white
            elevated: '#FEF9F4', // Warm cream
            dark: '#3A2D36',
            'dark-elevated': '#473B42',
          },
          // Additional pink tones
          pink: {
            blush: {
              50: '#FFFBFC',
              100: '#FFF5F8',
              200: '#FEEAF0',
              300: '#FDD8E5',
              400: '#FBC0D6',
              500: '#FFF0F5', // Very light pink
              600: '#F2B8D0',
              700: '#E495BB',
              800: '#D270A1',
              900: '#B85A87',
            },
            nude: {
              50: '#FDF9FB',
              100: '#FAF1F5',
              200: '#F4E2E9',
              300: '#EDCDDA',
              400: '#E3B2C7',
              500: '#FAE6EB', // Soft pink nude
              600: '#D4B5C1',
              700: '#B59BA8',
              800: '#94798A',
              900: '#6F5C6B',
            },
            taupe: {
              50: '#FAF7F8',
              100: '#F3EEEF',
              200: '#E8DADE',
              300: '#DAC3C9',
              400: '#C8A7B0',
              500: '#E1C3CD', // Pink taupe
              600: '#B8959F',
              700: '#947A84',
              800: '#736066',
              900: '#524649',
            },
            mocha: {
              50: '#F7F5F6',
              100: '#EDE8E9',
              200: '#D9CDD0',
              300: '#C0ADB3',
              400: '#A3888F',
              500: '#C39BAA', // Pink mocha
              600: '#A17A89',
              700: '#7F6370',
              800: '#604D56',
              900: '#43383E',
            },
          }
        },
        // Tremor color palette (keeping for compatibility)
        tremor: {
          brand: {
            faint: '#eff6ff', // blue-50
            muted: '#bfdbfe', // blue-200
            subtle: '#60a5fa', // blue-400
            DEFAULT: '#00C884', // Updated to fintech primary
            emphasis: '#047857', // Updated to fintech primary dark
            inverted: '#ffffff', // white
          },
          background: {
            muted: '#f8fafc', // Updated to fintech light
            subtle: '#f1f5f9', // Updated 
            DEFAULT: '#ffffff', // white
            emphasis: '#374151', // gray-700
          },
          border: {
            DEFAULT: '#e2e8f0', // Updated to match new theme
          },
          ring: {
            DEFAULT: '#e2e8f0', // Updated
          },
          content: {
            subtle: '#64748b', // Updated
            DEFAULT: '#475569', // Updated
            emphasis: '#334155', // Updated
            strong: '#0f172a', // Updated
            inverted: '#ffffff', // white
          },
        },
        // Dark mode colors
        dark: {
          tremor: {
            brand: {
              faint: '#0B1229', // custom
              muted: '#172554', // blue-900
              subtle: '#1e40af', // blue-800
              DEFAULT: '#00C884', // Updated to fintech primary
              emphasis: '#34D399', // Updated
              inverted: '#030712', // gray-950
            },
            background: {
              muted: '#0f172a', // Updated
              subtle: '#1e293b', // Updated
              DEFAULT: '#111827', // gray-900
              emphasis: '#cbd5e1', // Updated
            },
            border: {
              DEFAULT: '#334155', // Updated
            },
            ring: {
              DEFAULT: '#334155', // Updated
            },
            content: {
              subtle: '#64748b', // Updated
              DEFAULT: '#94a3b8', // Updated
              emphasis: '#e2e8f0', // Updated
              strong: '#f1f5f9', // Updated
              inverted: '#000000', // black
            },
          },
        },
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'number-counter': 'numberCounter 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'chart-draw': 'chartDraw 1.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)' 
          },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { 
            transform: 'translateX(20px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          },
        },
        scaleIn: {
          '0%': { 
            transform: 'scale(0.9)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
        },
        shimmer: {
          '0%': { 
            'background-position': '-200% 0' 
          },
          '100%': { 
            'background-position': '200% 0' 
          },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': {
            transform: 'translateY(0)',
          },
          '40%': {
            transform: 'translateY(-4px)',
          },
          '60%': {
            transform: 'translateY(-2px)',
          },
        },
        numberCounter: {
          '0%': { 
            transform: 'scale(1.1)', 
            opacity: '0.7' 
          },
          '100%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
        },
        chartDraw: {
          '0%': { 
            'stroke-dasharray': '0 100',
          },
          '100%': { 
            'stroke-dasharray': '100 0',
          },
        },
        glow: {
          '0%': { 
            'box-shadow': '0 0 5px rgba(0, 200, 132, 0.5)' 
          },
          '100%': { 
            'box-shadow': '0 0 20px rgba(0, 200, 132, 0.8)' 
          },
        },
      },
      boxShadow: {
        // Tremor shadows
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        // Dark shadows
        'dark-tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'dark-tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'dark-tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'tremor-small': '0.375rem',
        'tremor-default': '0.5rem',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
        'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  plugins: [require('@headlessui/tailwindcss')],
}