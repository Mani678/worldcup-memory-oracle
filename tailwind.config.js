/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        oracle: {
          bg: '#0a0a0f',
          card: '#12121a',
          border: '#1e1e2e',
          green: '#00ff87',
          red: '#ff3366',
          gold: '#ffd700',
          purple: '#7c3aed',
          muted: '#6b7280',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    }
  },
  plugins: []
}
