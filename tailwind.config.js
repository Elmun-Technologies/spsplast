/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clean commerce surfaces (reference: light page, white cards, hairline borders)
        surface: {
          DEFAULT: '#FFFFFF',
          page: '#F6F7F9',
          soft: '#F3F5F8',
          softer: '#F7F8FA',
        },
        line: {
          DEFAULT: '#EBEFF4',
          soft: '#F1F4F8',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#475569',
          sub: '#8B95A7',
        },
        brand: {
          red: '#E61C24',
          'red-dark': '#C4141B',
          'red-light': '#FEF2F2',
          'red-muted': '#FEE2E2',
          dark: '#161920',
          'dark-surface': '#1E222A',
          darker: '#070707',
          card: '#1E222A',
          border: '#2A2F3A',
          blue: '#2563eb',
          'blue-dark': '#1d4ed8',
          gray: '#6B7280',
          light: '#F8F9FA',
          muted: '#E5E7EB',
          success: '#059669',
          warning: '#D97706',
        },
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '1' }],
        '6xl': ['60px', { lineHeight: '1' }],
        '7xl': ['72px', { lineHeight: '1' }],
      },
      fontFamily: {
        // `var(--font-inter)` is injected by next/font (variable font, self-hosted)
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        // Soft, low-contrast elevation — replaces the heavier "industrial" shadows
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.05)',
        lift: '0 12px 28px -8px rgba(16, 24, 40, 0.14)',
        pop: '0 24px 60px -20px rgba(16, 24, 40, 0.25)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        // card / card-hover kept as aliases so existing markup keeps working
        'card-hover': '0 12px 28px -8px rgba(16, 24, 40, 0.14)',
        red: '0 8px 20px -8px rgba(230, 28, 36, 0.55)',
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
