import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'hsl(var(--bg-canvas-channel) / <alpha-value>)',
        subtle: 'hsl(var(--bg-subtle-channel) / <alpha-value>)',
        surface: {
          1: 'hsl(var(--surface-1-channel) / <alpha-value>)',
          2: 'hsl(var(--surface-2-channel) / <alpha-value>)',
          3: 'hsl(var(--surface-3-channel) / <alpha-value>)',
          accent: 'hsl(var(--surface-accent-channel) / <alpha-value>)',
        },
        border: {
          subtle: 'hsl(var(--border-subtle-channel) / <alpha-value>)',
          strong: 'hsl(var(--border-strong-channel) / <alpha-value>)',
        },
        text: {
          1: 'hsl(var(--text-1-channel) / <alpha-value>)',
          2: 'hsl(var(--text-2-channel) / <alpha-value>)',
          3: 'hsl(var(--text-3-channel) / <alpha-value>)',
          inverse: 'hsl(var(--text-inverse-channel) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent-channel) / <alpha-value>)',
          strong: 'hsl(var(--accent-strong-channel) / <alpha-value>)',
          soft: 'hsl(var(--accent-soft-channel) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success-channel) / <alpha-value>)',
          soft: 'hsl(var(--success-soft-channel) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning-channel) / <alpha-value>)',
          soft: 'hsl(var(--warning-soft-channel) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger-channel) / <alpha-value>)',
          soft: 'hsl(var(--danger-soft-channel) / <alpha-value>)',
        },
      },
      borderRadius: {
        xl: 'var(--radius-control)',
        '2xl': 'var(--radius-card)',
        '3xl': 'var(--radius-sheet)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      maxWidth: {
        shell: '82rem',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
