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
          blue: '#3b82f6', // Tailwind blue-500
          'blue-dark': '#2563eb', // Tailwind blue-600
          'blue-hover': '#60a5fa',
          red: '#FF3B30',
          'red-dark': '#d32f2f',
          gray: '#8a94a6',
          light: '#f7f8fa',
          muted: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        card: '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
        red: '0 4px 20px -2px rgba(255, 59, 48, 0.3)',
      },
    },
  },
  plugins: [],
}
