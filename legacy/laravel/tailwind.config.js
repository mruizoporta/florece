import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['Cormorant Garamond', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                shearly: {
                    50: '#FDF5F5',
                    100: '#F9E8E8',
                    200: '#F2D4D4',
                    300: '#E8A4A4',
                    400: '#D98B8B',
                    500: '#C96B6B',
                    600: '#B34D4D',
                    700: '#8F3D3D',
                    800: '#773535',
                    900: '#633030',
                },
                accent: {
                    gold: '#C9A961',
                    nude: '#E8DDD0',
                },
                /**
                 * Design system unificado (landing + dashboard).
                 * primary / primary-hover / primary-dark: mismos que CTA landing.
                 */
                brand: {
                    primary: '#FFD200',
                    'primary-hover': '#E6BD00',
                    /** Texto sobre botón amarillo (CTA landing) */
                    'primary-dark': '#665500',
                    /** Oscuro UI (sidebar, énfasis) — alias “primaryDark” del DS */
                    primaryDark: '#1D1F24',
                    /** Superficie app / cards context */
                    surface: '#F8F9FB',
                    /** Texto principal */
                    text: '#111827',
                    /** Texto secundario */
                    textMuted: '#6B7280',
                    ink: '#1D1F24',
                    'ink-muted': '#6B7280',
                    base: '#FFFDF8',
                    alt: '#FAF7F2',
                    cream: '#FFFDF8',
                    warm: '#FAF7F2',
                    'warm-alt': '#F5EFE8',
                    /** Compat: landing usaba surface cálido */
                    'surface-warm': '#FAF7F2',
                    'surface-alt': '#EDE5DD',
                    blush: '#E8B4A8',
                    'blush-light': '#F5E8E3',
                    'blush-bg': '#FBF5F2',
                    peach: '#F0D4C8',
                    /** Acento cálido (beauty / premium) */
                    terracotta: '#C49A7C',
                    'terracotta-light': '#E5D0C4',
                    'terracotta-muted': '#EDE0D8',
                    mist: '#F6F1EC',
                    'rose-mist': '#FAF6F3',
                    clay: '#E9DED8',
                },
            },
        },
    },

    plugins: [forms],
};
