/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        casino: {
          red: '#8B0000',
          darkRed: '#5c0000',
          gold: '#FFD700',
          darkGold: '#DAA520',
          purple: '#4B0082',
          neonGreen: '#39FF14',
          neonPink: '#FF00FF',
          dark: '#1a0a0a',
          darker: '#0d0505',
        }
      },
      fontFamily: {
        display: ['"Lilita One"', 'cursive'],
        digital: ['"Orbitron"', 'sans-serif'],
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'spin-fast': 'spin-reel 0.1s linear infinite',
        'win-bounce': 'win-bounce 0.5s ease-in-out',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'coin-pop': 'coin-pop 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { textShadow: '0 0 5px #FFD700, 0 0 10px #FFD700, 0 0 20px #FFD700' },
          '50%': { textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 80px #FFD700' },
        },
        'spin-reel': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100px)' },
        },
        'win-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px #FFD700, 0 0 10px #FFD700' },
          '100%': { boxShadow: '0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFD700' },
        },
        'coin-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
