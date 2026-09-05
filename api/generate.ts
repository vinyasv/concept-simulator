import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GeminiGatewayError, generateWithFallback } from '../server/geminiGateway';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: 'Missing required fields: model, contents' });
    }

    const result = await generateWithFallback({
      apiKey: process.env.GEMINI_API_KEY,
      model,
      contents,
      config,
    });

    res.status(200).json({
      ...result,
      success: true,
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    const gatewayError = error instanceof GeminiGatewayError ? error : null;
    res.status(gatewayError?.statusCode ?? 500).json({
      error: gatewayError?.message ?? 'We could not complete that AI request. Please try again.',
      code: gatewayError?.code ?? 'GENERATION_FAILED',
      success: false,
    });
  }
}
