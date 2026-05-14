/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agri-green': '#22c55e',
        'agri-dark': '#15803d',
        'agri-light': '#dcfce7',
        primary: {
          light: '#4ade80',
          DEFAULT: '#22c55e',
          dark: '#166534',
        }
      }
    },
  },
  plugins: [],
}
