import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    base: '/portfolio/', // le dépôt s'appelle 'portfolio'
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                mainEn: resolve(__dirname, 'index-en.html'),
                about: resolve(__dirname, 'about.html'),
                aboutEn: resolve(__dirname, 'about-en.html'),
                expertise: resolve(__dirname, 'expertise.html'),
                expertiseEn: resolve(__dirname, 'expertise-en.html'),
                projects: resolve(__dirname, 'projects.html'),
                projectsEn: resolve(__dirname, 'projects-en.html'),
                contact: resolve(__dirname, 'contact.html'),
                contactEn: resolve(__dirname, 'contact-en.html'),
            },
        },
    },
})
