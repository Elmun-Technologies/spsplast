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
          red: '#e61c24',
          'red-dark': '#c41219',
          'red-light': '#ff4d54',
          dark: '#0f1115',
          card: '#161920',
          border: '#262b36',
          gray: '#8a94a6',
          light: '#f7f8fa',
          muted: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        red: '0 4px 20px -2px rgba(230, 28, 36, 0.4)',
      },
    },
  },
  plugins: [],
}
