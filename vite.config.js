import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

/**
 * Middleware local pour simuler/traiter l'endpoint API neutre /api/newsletter/export.
 * Permet de tester localement sans déploiement en production.
 */
function newsletterApiPlugin() {
  return {
    name: 'newsletter-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/newsletter/export', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const apiKey = process.env.NEWSLETTER_API_KEY;
            const templateId = process.env.NEWSLETTER_TEMPLATE_ID;

            console.log('[Newsletter API Endpoint Neutre] Payload reçu avec succès :', {
              titre_campagne: payload.titre_campagne,
              nombre_prochaines_dates: payload.prochaines_dates?.length || 0,
              nombre_evenements_passes: payload.evenements_passes?.length || 0
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                message: 'Brouillon de newsletter généré avec succès dans le service emailing.',
                draftId: `draft_${Date.now()}`,
                provider: apiKey ? 'brevo' : 'neutral-adapter-local',
                templateId: templateId || 'template-default',
                receivedData: payload
              })
            );
          } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Format JSON invalide.' }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(`v${packageJson.version}`)
  },
  plugins: [
    react(),
    tailwindcss(),
    newsletterApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'og-image.png', 'manifest.json'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__/, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        importScripts: ['/firebase-messaging-sw.js'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash]-' + Date.now() + '.js',
        chunkFileNames: 'assets/[name]-[hash]-' + Date.now() + '.js',
        assetFileNames: 'assets/[name]-[hash]-' + Date.now() + '.[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('react')) {
              return 'react';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
