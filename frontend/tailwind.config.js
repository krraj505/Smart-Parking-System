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
        navy: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#0F1626',
          800: '#111827',
          750: '#151E32',
          700: '#1E293B',
          600: '#334155',
        },
        electric: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        status: {
          available: '#10B981',   // Emerald Green
          occupied: '#EF4444',    // Red
          reserved: '#3B82F6',    // Electric Blue
          maintenance: '#F59E0B', // Amber
          disabled: '#64748B',    // Gray
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px -3px rgba(59, 130, 246, 0.35)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
