# `vite-plugin-pwa` config snippet

`npm i -D vite-plugin-pwa`, then in `vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // ...your other plugins
    VitePWA({
      registerType: 'autoUpdate',
      // This is a SEPARATE service worker from firebase-messaging-sw.js
      // (that one is registered manually in notifications.ts, at its own
      // scope). Keep them from colliding — see README gotcha #1.
      filename: 'sw.js',
      injectRegister: 'auto',
      manifest: {
        name: '<Full App Name>',
        short_name: '<Short Name>',
        description: '<One-line description>',
        theme_color: '<#hex>',
        background_color: '<#hex>',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
```

Vercel serves static files (like `/firebase-messaging-sw.js` in `public/`) before
applying SPA rewrites, so a catch-all rewrite to `/index.html` in `vercel.json` won't
break this — confirmed by curling the deployed file directly and checking it returns
JS, not HTML.
