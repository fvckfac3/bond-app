import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bond: {
          50: '#fdf2f4',
          100: '#fbe6ea',
          500: '#d94f6c',
          600: '#c23a58',
          700: '#a22d48',
          900: '#5c1a2a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
