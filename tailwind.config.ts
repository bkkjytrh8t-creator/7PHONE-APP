import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#C2185B',
          neon: '#ff008c',
          black: '#0B0B0D',
          ink: '#17171B',
          paper: '#FFFFFF',
          whatsapp: '#25D366'
        }
      },
      boxShadow: {
        neon: '0 8px 24px rgba(17, 17, 23, 0.08)',
        'neon-strong': '0 16px 42px rgba(17, 17, 23, 0.16)'
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Geeza Pro',
          'Noto Sans Arabic',
          'Inter',
          'Arial',
          'system-ui',
          'sans-serif'
        ],
        arabic: ['Geeza Pro', 'Noto Sans Arabic', 'Tahoma', 'Arial', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
