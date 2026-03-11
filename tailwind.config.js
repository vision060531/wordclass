/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        bg: '#0f0f13',
        surface: '#1a1a22',
        surface2: '#22222e',
        border: '#2e2e3e',
        accent: '#6c63ff',
        accent2: '#ff6b6b',
        accent3: '#43e97b',
        muted: '#7070a0',
      }
    },
  },
  plugins: [],
}
