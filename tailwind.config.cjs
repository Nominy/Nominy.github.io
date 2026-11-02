/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
