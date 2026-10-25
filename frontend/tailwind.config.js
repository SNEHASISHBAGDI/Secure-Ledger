/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#080809',
          sidebar: '#0D0D10',
          card: '#141418',
          elevated: '#19191F',
          border: '#282831',
        },
        primary: {
          DEFAULT: '#9333EA', // Primary purple
          highlight: '#A855F7',
        },
        content: {
          primary: '#F5F5F7',
          secondary: '#92929F',
        },
        status: {
          success: '#22c55e', // green
          pending: '#f59e0b', // amber
          critical: '#ef4444', // red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}