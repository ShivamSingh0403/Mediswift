/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbfb',
          100: '#d5f5f5',
          200: '#afebe9',
          300: '#76dbd8',
          400: '#38bfc0',
          500: '#0d9488', // Teal primary
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#13413f',
        },
        navy: {
          900: '#0f172a',
          800: '#1e293b',
        }
      },
    },
  },
  plugins: [],
};
