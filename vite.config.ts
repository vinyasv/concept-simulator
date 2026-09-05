import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { GeminiGatewayError, generateWithFallback } from './server/geminiGateway';

const localGeminiApi = (apiKey?: string): Plugin => ({
  name: 'local-gemini-api',
  configureServer(server) {
    server.middlewares.use('/api/generate', async (request, response) => {
      response.setHeader('Content-Type', 'application/json');

      if (request.method !== 'POST') {
        response.statusCode = 405;
        response.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      if (!apiKey) {
        response.statusCode = 500;
        response.end(JSON.stringify({ error: 'Add GEMINI_API_KEY to .env.local to use AI features locally.' }));
        return;
      }

      try {
        let body = '';
        for await (const chunk of request) body += chunk;
        const { model, contents, config } = JSON.parse(body);

        if (!model || !contents) {
          response.statusCode = 400;
          response.end(JSON.stringify({ error: 'Missing required fields: model, contents' }));
          return;
        }

        const result = await generateWithFallback({ apiKey, model, contents, config });
        response.statusCode = 200;
        response.end(JSON.stringify({ ...result, success: true }));
      } catch (error) {
        const gatewayError = error instanceof GeminiGatewayError ? error : null;
        response.statusCode = gatewayError?.statusCode ?? 500;
        response.end(JSON.stringify({
          error: gatewayError?.message ?? 'We could not complete that AI request. Please try again.',
          code: gatewayError?.code ?? 'GENERATION_FAILED',
          success: false,
        }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), localGeminiApi(env.GEMINI_API_KEY)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
