// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  supabase: {
    redirect: false, // We handle redirects manually
  },
  runtimeConfig: {
    // Server-only (never exposed to client)
    openaiApiKey: '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  app: {
    head: {
      title: 'Tayaq.ai — Learn English Through Pain 🔥',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'The most brutal AI English tutor. Get roasted in Kazakh for your grammar mistakes, then actually learn. Speech-to-Speech powered.'
        },
        { name: 'theme-color', content: '#0a0a0a' }
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap'
        }
      ]
    }
  }
})
