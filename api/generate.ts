import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const aiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY 
    });

    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: 'Missing required fields: model, contents' });
    }

    // Call Gemini API
    const response = await aiClient.models.generateContent({
      model,
      contents,
      config
    });

    // Return the response
    res.status(200).json({ 
      text: response.text || '',
      success: true 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Return error response
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Generation failed',
      success: false 
    });
  }
}
