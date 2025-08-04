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
        // Warm Pink-Beige Fintech Palette (2025 Design Trends)
        fintech: {
          primary: {
            50: '#FDF9F7',
            100: '#F9EFEB',
            200: '#F0DDD5',
            300: '#E5C5B5',
            400: '#D4A58E',
            500: '#BA8479', // Warm terracotta
            600: '#A66B5F',
            700: '#8B5549',
            800: '#6D423A',
            900: '#4A2D28',
          },
          secondary: {
            50: '#FDF8F5',
            100: '#FAEDE6',
            200: '#F4D8CA',
            300: '#ECBFA3',
            400: '#E1A078',
            500: '#DAA58E', // Champagne rose
            600: '#C18A6F',
            700: '#A16F56',
            800: '#7E5544',
            900: '#5A3C2F',
          },
          accent: {
            50: '#F7F4F6',
            100: '#EDE6EA',
            200: '#DBC9D1',
            300: '#C4A5B3',
            400: '#A97F90',
            500: '#A37F90', // Dusty mauve
            600: '#8F6B7C',
            700: '#755667',
            800: '#5B4350',
            900: '#3E2F38',
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
            50: '#FEFAF6',
            100: '#FCF2E7',
            200: '#F8E2C6',
            300: '#F2CE9F',
            400: '#E9B672',
            500: '#CDA45E', // Warm amber
            600: '#B18F4D',
            700: '#95773D',
            800: '#755E2F',
            900: '#534220',
          },
          error: {
            50: '#FDF5F5',
            100: '#FAE8E8',
            200: '#F4D0D0',
            300: '#EBB0B0',
            400: '#E08A8A',
            500: '#BC6C6C', // Muted coral
            600: '#A35757',
            700: '#854545',
            800: '#663636',
            900: '#472626',
          },
          surface: {
            light: '#FEFCFA', // Warm white
            elevated: '#FAF6F2', // Cream
            dark: '#3A2D28',
            'dark-elevated': '#473B34',
          },
          // Additional warm tones
          warm: {
            blush: {
              50: '#FEFBF9',
              100: '#FDF6F2',
              200: '#F9EDE6',
              300: '#F2DCD4',
              400: '#E8C5B7',
              500: '#F2DCD4', // Warm blush
              600: '#D4B8A6',
              700: '#B5988A',
              800: '#94786C',
              900: '#6B5851',
            },
            nude: {
              50: '#FDFAF8',
              100: '#FAF3EF',
              200: '#F4E7DE',
              300: '#EDD6C8',
              400: '#E3C0AC',
              500: '#E6D2C8', // Warm nude
              600: '#C7B5A5',
              700: '#A8968A',
              800: '#87786E',
              900: '#635852',
            },
            taupe: {
              50: '#FAF8F6',
              100: '#F3EFEC',
              200: '#E8E0DA',
              300: '#DACDC3',
              400: '#C8B5AA',
              500: '#C6B5AA', // Warm taupe
              600: '#A8978E',
              700: '#8A7973',
              800: '#6C5E5A',
              900: '#4E4441',
            },
            mocha: {
              50: '#F7F5F3',
              100: '#EDE8E4',
              200: '#D9CFC7',
              300: '#C0B0A5',
              400: '#A38D7E',
              500: '#8D6E63', // Warm mocha
              600: '#785F55',
              700: '#624E46',
              800: '#4C3D37',
              900: '#362C28',
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