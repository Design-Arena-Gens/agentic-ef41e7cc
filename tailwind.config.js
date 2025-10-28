/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0d12',
        surface: '#151822',
        accent: '#36c2ff',
        warning: '#ffb347',
        success: '#7cf5c3'
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 24px rgba(54, 194, 255, 0.45)'
      }
    }
  },
  plugins: []
};
