/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AudioFile custom colors - preserved for backward compatibility
        canvas: {
          light: '#f5f5f5',
          dark: '#1a1a1a',
        },
        panel: {
          light: '#ffffff',
          dark: '#242424',
        },

        // ── Neutral Scale ──────────────────────────────────────
        neutral: {
          950: '#0A0A0F',
          900: '#0D0D12',
          850: '#111118',
          800: '#17171F',
          750: '#1D1D26',
          700: '#333345',
          600: '#3A3A50',
          500: '#5A5A70',
          400: '#8A8AA0',
          300: '#AAAABC',
          200: '#CCCCDA',
          100: '#E8E8F0',
          50:  '#F5F5FA',
        },

        // ── Surface Aliases ────────────────────────────────────
        surface: {
          base:    '#0A0A0F',
          canvas:  '#0D0D12',
          panel:   '#111118',
          element: '#17171F',
          raised:  '#1D1D26',
        },

        // ── Destructive State ──────────────────────────────────
        destructive: {
          DEFAULT: '#EF4444',
          muted:   '#7F1D1D',
          surface: '#1A0808',
          text:    '#FCA5A5',
        },
      },

      // ── Spacing Scale ──────────────────────────────────────
      spacing: {
        'af-1':  '4px',
        'af-2':  '8px',
        'af-3':  '12px',
        'af-4':  '16px',
        'af-6':  '24px',
        'af-8':  '32px',
        'af-12': '48px',
      },

      // ── Border Radius Scale ────────────────────────────────
      borderRadius: {
        'af-sm':   '4px',
        'af-md':   '6px',
        'af-lg':   '8px',
        'af-xl':   '10px',
        'af-pill': '9999px',
      },

      // ── Shadow Scale ───────────────────────────────────────
      boxShadow: {
        'af-sm':    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
        'af-md':    '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
        'af-lg':    '0 8px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)',
        'af-float': '0 12px 32px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.5)',
        'af-lift':  '0 8px 20px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)',
      },

      // ── Typography ─────────────────────────────────────────
      fontFamily: {
        'af-ui':    ['DM Sans', 'system-ui', 'sans-serif'],
        'af-brand': ['Syne', 'system-ui', 'sans-serif'],
        'af-mono':  ['DM Mono', 'monospace'],
      },
      fontSize: {
        'af-display': ['17px', { lineHeight: '24px', fontWeight: '700' }],
        'af-heading': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'af-body':    ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'af-small':   ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'af-xs':      ['11px', { lineHeight: '16px', fontWeight: '400' }],
        'af-label':   ['10px', { lineHeight: '14px', fontWeight: '600' }],
      },

      // ── Motion Tokens ──────────────────────────────────────
      transitionDuration: {
        'af-fast': '150ms',
        'af-base': '200ms',
        'af-slow': '220ms',
      },
      transitionTimingFunction: {
        'af-ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'af-ease-in':  'cubic-bezier(0.4, 0, 1, 1)',
        'af-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
