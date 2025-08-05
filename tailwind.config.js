/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        // Municipal service result colors
        success: {
          DEFAULT: 'rgb(var(--success))',
          foreground: 'rgb(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning))',
          foreground: 'rgb(var(--warning-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'rgb(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        // Government-appropriate font stack
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      spacing: {
        // Municipal spacing scale
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        // Municipal typography scale matching CSS classes
        'municipal-xs': ['0.75rem', { lineHeight: '1.25rem' }],
        'municipal-sm': ['0.875rem', { lineHeight: '1.375rem' }],
        'municipal-base': ['1rem', { lineHeight: '1.625rem' }],
        'municipal-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'municipal-xl': ['1.25rem', { lineHeight: '1.875rem' }],
        'municipal-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'municipal-3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      },
      boxShadow: {
        'municipal': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'municipal-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}