/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Black Mirror Core Palette
        'mirror-black': '#000000',
        'void-deep': '#0a0a0a',
        'void-surface': '#0f0f0f',
        'void-elevated': '#141414',
        
        // Neutral Grays - Cold and Clinical
        'static-white': '#e8e8e8',
        'static-dim': '#b0b0b0',
        'static-muted': '#6b6b6b',
        'static-ghost': '#3a3a3a',
        'static-whisper': '#1f1f1f',
        
        // Accent Colors - Unsettling and Minimal
        'glitch-red': '#ff0033',
        'glitch-red-dim': '#cc0029',
        'unsettling-blue': '#0066ff',
        'unsettling-blue-dim': '#0052cc',
        'warning-amber': '#ffaa00',
        'warning-amber-dim': '#cc8800',
        
        // System Status Colors
        'system-active': '#00ff88',
        'system-error': '#ff1744',
        'system-warning': '#ffc107',
        'system-idle': '#546e7a',
        
        // Overlay and Glass Effects
        'overlay-light': 'rgba(255, 255, 255, 0.03)',
        'overlay-medium': 'rgba(255, 255, 255, 0.06)',
        'overlay-heavy': 'rgba(255, 255, 255, 0.10)',
        'overlay-dark': 'rgba(0, 0, 0, 0.6)',
        'overlay-darker': 'rgba(0, 0, 0, 0.85)',
      },
      
      fontFamily: {
        // Primary: Clean, minimal, slightly cold
        'sans': [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        
        // Monospace: For system messages and technical elements
        'mono': [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace'
        ],
        
        // Display: For dramatic moments (optional, can use sans)
        'display': [
          'Space Grotesk',
          'Inter',
          'sans-serif'
        ]
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      
      boxShadow: {
        'glow-red': '0 0 20px rgba(255, 0, 51, 0.4), 0 0 40px rgba(255, 0, 51, 0.2)',
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.4), 0 0 40px rgba(0, 102, 255, 0.2)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.4), 0 0 40px rgba(0, 255, 136, 0.2)',
        'void': '0 10px 40px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.9)',
        'void-lg': '0 20px 60px rgba(0, 0, 0, 0.9), 0 4px 16px rgba(0, 0, 0, 0.95)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 2s linear infinite',
        'glitch': 'glitch 3s infinite',
        'scan': 'scan 8s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41.99%': { opacity: '1' },
          '42%': { opacity: '0' },
          '43%': { opacity: '0' },
          '43.01%': { opacity: '1' },
          '47.99%': { opacity: '1' },
          '48%': { opacity: '0' },
          '49%': { opacity: '0' },
          '49.01%': { opacity: '1' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      backdropBlur: {
        'xs': '2px',
      },
      
      transitionDuration: {
        '400': '400ms',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
