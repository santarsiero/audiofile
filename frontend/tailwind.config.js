/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AudioFile custom colors - can be refined later
        canvas: {
          light: '#f5f5f5',
          dark: '#1a1a1a',
        },
        panel: {
          light: '#ffffff',
          dark: '#242424',
        },
      },
    },
  },
  plugins: [],
}
