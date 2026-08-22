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
        brand: {
          red: '#E61C24',
          'red-dark': '#C4141B',
          'red-light': '#FEF2F2',
          'red-muted': '#FEE2E2',
          dark: '#161920',
          'dark-surface': '#1E222A',
          blue: '#2563eb',
          'blue-dark': '#1d4ed8',
          gray: '#6B7280',
          light: '#F8F9FA',
          muted: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
        red: '0 4px 14px 0 rgba(230, 28, 36, 0.28)',
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
