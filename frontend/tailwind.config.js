/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Указывает на все JS/JSX/TS/TSX-файлы
    "./public/index.html", // Если классы есть в HTML
    "./index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [
  ],
}

