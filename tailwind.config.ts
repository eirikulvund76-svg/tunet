// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body:    ['var(--font-dm-sans)',  'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#2D5A27',
          light:   '#EAF3DE',
        },
        danger: {
          DEFAULT: '#A32D2D',
          light:   '#FCEBEB',
        },
        warning: {
          DEFAULT: '#BA7517',
          light:   '#FAEEDA',
        },
        info: {
          DEFAULT: '#185FA5',
          light:   '#E6F1FB',
        },
        surface: '#FFFFFF',
        bg:      '#FAF8F4',
        border:  '#E8E4DC',
        muted:   '#6B6860',
      },
      borderRadius: {
        card: '12px',
        btn:  '10px',
      },
    },
  },
  plugins: [],
}

export default config
