/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                brand: {
                    black: '#0a0a0a',
                    dark: '#111111',
                    card: '#1a1a1a',
                    border: '#2a2a2a',
                },
                accent: {
                    red: '#ef4444',
                    'red-hot': '#dc2626',
                    amber: '#f59e0b',
                    'amber-glow': '#fbbf24',
                    flame: '#f97316',
                },
                kazakh: {
                    sky: '#00bcd4',
                    gold: '#ffd700',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'shake': 'shake 0.5s ease-in-out',
                'slide-up': 'slideUp 0.6s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'bounce-in': 'bounceIn 0.6s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.1)' },
                    '100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.2)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-pattern': 'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)',
            },
        },
    },
    plugins: [],
}
