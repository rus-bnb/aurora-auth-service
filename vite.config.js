import { defineConfig } from 'vite';

export default defineConfig({
    // './' → сборка портируема (работает и в корне, и в подпапке)
    base: './',

    server: {
        port: 3000,
        open: true,
        // обязательно: crypto.subtle требует secure context
        host: 'localhost',
    },

    preview: {
        port: 4173,
    },

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        // target es2022 — иначе ESBuild будет транспилировать
        // приватные поля #foo в WeakMap-полифилл
        target: 'es2022',
        sourcemap: false,
        cssCodeSplit: false, // один CSS-файл — не критично, но проще для кеша
    },
});