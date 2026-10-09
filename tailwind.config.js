/** @type {import('tailwindcss').Config} */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: token('border'),
          subtle: token('border-subtle'),
          strong: token('border-strong'),
        },
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        surface: {
          1: token('surface-1'),
          2: token('surface-2'),
          3: token('surface-3'),
        },
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
          light: token('primary-light'),
        },
        secondary: {
          DEFAULT: token('secondary'),
          foreground: token('secondary-foreground'),
        },
        destructive: {
          DEFAULT: 'hsl(0 72% 56% / <alpha-value>)',
          foreground: 'hsl(0 0% 100% / <alpha-value>)',
        },
        success: 'hsl(152 60% 45% / <alpha-value>)',
        warning: 'hsl(38 92% 52% / <alpha-value>)',
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        popover: {
          DEFAULT: token('popover'),
          foreground: token('popover-foreground'),
        },
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) * 0.75)',
        sm: 'calc(var(--radius) * 0.5)',
        xl: 'calc(var(--radius) * 1.5)',
        '2xl': 'calc(var(--radius) * 2)',
        '3xl': 'calc(var(--radius) * 3)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        13: ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px hsl(var(--primary) / 0.35), 0 8px 32px -8px hsl(var(--primary) / 0.45)',
        'glow-sm': '0 0 0 1px hsl(var(--primary) / 0.25), 0 4px 16px -6px hsl(var(--primary) / 0.4)',
        elevated: 'inset 0 1px 0 0 hsl(0 0% 100% / 0.04), 0 1px 2px 0 rgb(0 0 0 / 0.2), 0 8px 24px -12px rgb(0 0 0 / 0.45)',
        popover: 'inset 0 1px 0 0 hsl(0 0% 100% / 0.05), 0 0 0 1px hsl(var(--border)), 0 24px 64px -16px rgb(0 0 0 / 0.55)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
        enter: 'enter 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        flash: 'flash 1.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        enter: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        flash: {
          '0%': { boxShadow: '0 0 0 2px hsl(var(--primary) / 0.7)' },
          '100%': { boxShadow: '0 0 0 2px hsl(var(--primary) / 0)' },
        },
      },
    },
  },
  plugins: [],
};
