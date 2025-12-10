/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        luxury: {
          black: '#0a0a0a',
          charcoal: '#121212',
          gold: '#D4AF37',
          goldDim: '#8a7e58',
          cream: '#F5F5F0',
        },
        glass: {
          dark: 'rgba(10, 10, 10, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      backgroundImage: {
        'hero-pattern': "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')",
        'noise': "url('https://grainy-gradients.vercel.app/noise.svg')",
        'vignette': 'radial-gradient(circle, transparent 20%, #0a0a0a 100%)',
      }
    },
  },
  plugins: [],
}

