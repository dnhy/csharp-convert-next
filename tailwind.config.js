/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          base: "#141414",
          surface: "#1a1a1a",
          border: "#2a2a2a",
        },
      },
    },
  },
  plugins: [],
};

