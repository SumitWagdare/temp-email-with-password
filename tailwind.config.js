/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          glow: 'rgb(var(--accent-glow-rgb) / <alpha-value>)',
          light: 'rgb(var(--accent-light-rgb) / <alpha-value>)',
        },
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(var(--accent-rgb), 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(var(--accent-rgb), 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
