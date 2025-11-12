/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // The Void - Pure darkness
        'mirror-black': '#000000',
        'void-deep': '#050505',
        'void-surface': '#0a0a0a',
        'void-elevated': '#0f0f0f',
        
        // Static - Cold, lifeless grays (improved contrast)
        'static-white': '#f0f0f0',      // Brighter for main text
        'static-dim': '#b8b8b8',        // Lighter for secondary text
        'static-muted': '#808080',      // More readable for tertiary text
        'static-ghost': '#4a4a4a',      // Lighter for labels/hints
        'static-whisper': '#1a1a1a',
        
        // Glitch - Error states, warnings
        'glitch-red': '#ff0033',
        'glitch-red-dim': '#cc0029',
        'glitch-pink': '#ff0080',
        
        // Unsettling - Primary interactions
        'unsettling-cyan': '#00d9ff',
        'unsettling-cyan-dim': '#00a8cc',
        'unsettling-blue': '#0066ff',
        'unsettling-blue-dim': '#0052cc',
        
        // System - Status indicators
        'system-active': '#00ff88',
        'system-error': '#ff1744',
        'system-warning': '#ffaa00',
        'system-idle': '#546e7a',
        
        // The Chasm - For the central void
        'chasm-start': 'rgba(0, 217, 255, 0.0)',
        'chasm-mid': 'rgba(0, 217, 255, 0.15)',
        'chasm-end': 'rgba(0, 217, 255, 0.0)',
        
        // Overlay effects
        'overlay-light': 'rgba(255, 255, 255, 0.03)',
        'overlay-medium': 'rgba(255, 255, 255, 0.06)',
        'overlay-heavy': 'rgba(255, 255, 255, 0.10)',
        'overlay-dark': 'rgba(0, 0, 0, 0.6)',
        'overlay-darker': 'rgba(0, 0, 0, 0.85)',
      },
      
      fontFamily: {
        // Primary: Cold, clinical, slightly unsettling
        'sans': [
          'IBM Plex Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
        
        // Monospace: Terminal, logs, system messages
        'mono': [
          'IBM Plex Mono',
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace'
        ],
        
        // Display: For dramatic moments
        'display': [
          'Space Grotesk',
          'IBM Plex Sans',
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
        'glitch': 'glitch 0.5s infinite',
        'glitch-text': 'glitchText 0.3s infinite',
        'rgb-split': 'rgbSplit 0.4s infinite',
        'scan': 'scan 8s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scroll-pulse': 'scrollPulse 2s ease-in-out infinite',
        'distort': 'distort 0.3s infinite',
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
          '0%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
          '10%': { transform: 'translate(-5px, 3px)', filter: 'hue-rotate(90deg)' },
          '20%': { transform: 'translate(5px, -4px)', filter: 'hue-rotate(180deg)' },
          '30%': { transform: 'translate(-3px, -5px)', filter: 'hue-rotate(270deg)' },
          '40%': { transform: 'translate(4px, 5px)', filter: 'hue-rotate(0deg)' },
          '50%': { transform: 'translate(-6px, 2px)', filter: 'hue-rotate(90deg)' },
          '60%': { transform: 'translate(6px, -3px)', filter: 'hue-rotate(180deg)' },
          '70%': { transform: 'translate(-4px, 4px)', filter: 'hue-rotate(270deg)' },
          '80%': { transform: 'translate(3px, -6px)', filter: 'hue-rotate(0deg)' },
          '90%': { transform: 'translate(-5px, 6px)', filter: 'hue-rotate(90deg)' },
          '100%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
        },
        glitchText: {
          '0%': { 
            transform: 'translate(0)',
            textShadow: '2px 0 #ff0033, -2px 0 #00d9ff'
          },
          '25%': { 
            transform: 'translate(-3px, 2px)',
            textShadow: '-3px 0 #ff0033, 3px 0 #00d9ff'
          },
          '50%': { 
            transform: 'translate(3px, -2px)',
            textShadow: '3px 0 #ff0033, -3px 0 #00d9ff'
          },
          '75%': { 
            transform: 'translate(-2px, -3px)',
            textShadow: '-2px 0 #ff0033, 2px 0 #00d9ff'
          },
          '100%': { 
            transform: 'translate(0)',
            textShadow: '2px 0 #ff0033, -2px 0 #00d9ff'
          },
        },
        rgbSplit: {
          '0%, 100%': { 
            textShadow: '0 0 transparent'
          },
          '33%': { 
            textShadow: '-4px 0 #ff0033, 4px 0 #00d9ff, 0 0 #00ff88'
          },
          '66%': { 
            textShadow: '4px 0 #ff0033, -4px 0 #00d9ff, 0 0 #00ff88'
          },
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
        scrollPulse: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        distort: {
          '0%, 100%': { 
            transform: 'scaleX(1) scaleY(1) skew(0deg)',
          },
          '25%': { 
            transform: 'scaleX(0.98) scaleY(1.02) skew(-1deg)',
          },
          '50%': { 
            transform: 'scaleX(1.02) scaleY(0.98) skew(1deg)',
          },
          '75%': { 
            transform: 'scaleX(0.99) scaleY(1.01) skew(-0.5deg)',
          },
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
