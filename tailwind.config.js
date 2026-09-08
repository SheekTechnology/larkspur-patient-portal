/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        larkspur: {
          50: '#f2f5fc', 100: '#e2e9f8', 200: '#cbd8f2',
          300: '#a7bde8', 400: '#7d9adb', 500: '#5e79cf',
          600: '#4a5dc2', 700: '#404db1', 800: '#39428f',
          900: '#333b72', 950: '#222646',
        },
      },
    },
  },
  plugins: [],
}
