import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/

/**
 * apiMiddlewarePlugin
 *
 * Intercepts requests to /api/* in dev and routes them to the matching
 * file in api/*.js — the same files that Vercel deploys as serverless
 * functions in production. No Vercel CLI needed locally.
 *
 * Env vars without the VITE_ prefix (e.g. ANTHROPIC_API_KEY) are NOT
 * exposed to the browser by Vite. We load them here explicitly with
 * loadEnv so they are available in process.env inside the SSR-loaded
 * API modules.
 */
const apiMiddlewarePlugin = (env) => ({
  name: 'lumina-api-middleware',
  configureServer(server) {
    // Inject non-VITE_ env vars from .env.local into process.env
    // so API handlers can read e.g. process.env.ANTHROPIC_API_KEY
    for (const [key, value] of Object.entries(env)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }

    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();

      try {
        // Collect request body chunks
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body =
          chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};

        // Build lightweight request/response shims matching Vercel's interface
        const reqLike = { ...req, body, method: req.method };
        const resLike = {
          _statusCode: 200,
          status(code) {
            res.statusCode = code;
            this._statusCode = code;
            return this;
          },
          json(data) {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          },
          setHeader(k, v) {
            res.setHeader(k, v);
          },
        };

        // Dynamically load the handler via Vite's SSR module loader
        // (resolves imports relative to the project root correctly)
        const apiPath = req.url.replace(/^\/api\//, '').split('?')[0];
        const module = await server.ssrLoadModule(`/api/${apiPath}.js`);

        if (typeof module.default !== 'function') {
          throw new Error(`api/${apiPath}.js does not export a default function`);
        }

        await module.default(reqLike, resLike);
      } catch (e) {
        console.error('[lumina-api-middleware]', e);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Internal server error',
              detail: e.message,
            })
          );
        }
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  // Load ALL env vars (including those without VITE_ prefix) for the middleware
  const env = loadEnv(mode, process.cwd(), ''); // '' prefix = load everything

  return {
    plugins: [react(), apiMiddlewarePlugin(env)],
    test: {
      environment: 'jsdom',
      globals: true,
    },
  };
});
