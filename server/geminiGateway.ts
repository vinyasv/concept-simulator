import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL_FALLBACK, GEMINI_MODEL_PRIMARY } from '../geminiModels.js';

interface GenerateRequest {
  apiKey: string;
  model: string;
  contents: any;
  config?: any;
}

interface ProviderErrorDetails {
  code?: number;
  status?: string;
  message: string;
}

export class GeminiGatewayError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: 'MODEL_BUSY' | 'RATE_LIMITED' | 'AUTH_FAILED' | 'GENERATION_FAILED',
  ) {
    super(message);
    this.name = 'GeminiGatewayError';
  }
}

const readProviderError = (error: unknown): ProviderErrorDetails => {
  const errorObject = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  let message = error instanceof Error ? error.message : String(error ?? '');
  let details = errorObject;

  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === 'object') details = parsed as Record<string, unknown>;
  } catch {
    // The SDK sometimes returns plain-text errors instead of JSON.
  }

  const nested = details.error && typeof details.error === 'object'
    ? details.error as Record<string, unknown>
    : details;

  if (typeof nested.message === 'string') message = nested.message;

  const rawCode = nested.code ?? details.code;
  const numericCode = typeof rawCode === 'number' ? rawCode : Number(rawCode);

  return {
    code: Number.isFinite(numericCode) ? numericCode : undefined,
    status: typeof nested.status === 'string' ? nested.status : undefined,
    message,
  };
};

const isCapacityError = (error: unknown) => {
  const details = readProviderError(error);
  return details.code === 503
    || details.status === 'UNAVAILABLE'
    || /high demand|temporarily unavailable|service unavailable/i.test(details.message);
};

const toGatewayError = (error: unknown): GeminiGatewayError => {
  const details = readProviderError(error);

  if (isCapacityError(error)) {
    return new GeminiGatewayError(
      'The AI models are busy right now. Please try again in a moment.',
      503,
      'MODEL_BUSY',
    );
  }

  if (details.code === 429 || /rate limit|quota/i.test(details.message)) {
    return new GeminiGatewayError(
      'The AI service has reached its temporary usage limit. Please try again shortly.',
      429,
      'RATE_LIMITED',
    );
  }

  if (details.code === 401 || details.code === 403 || /api key|permission denied|unauthorized/i.test(details.message)) {
    return new GeminiGatewayError(
      'The AI service could not authenticate. Check the configured API key.',
      details.code === 401 ? 401 : 403,
      'AUTH_FAILED',
    );
  }

  return new GeminiGatewayError(
    'We could not complete that AI request. Please try again.',
    500,
    'GENERATION_FAILED',
  );
};

export const generateWithFallback = async ({ apiKey, model, contents, config }: GenerateRequest) => {
  const client = new GoogleGenAI({ apiKey });

  try {
    const response = await client.models.generateContent({ model, contents, config });
    return { text: response.text || '', model, fallbackUsed: false };
  } catch (primaryError) {
    if (model !== GEMINI_MODEL_PRIMARY || !isCapacityError(primaryError)) {
      throw toGatewayError(primaryError);
    }

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL_FALLBACK,
        contents,
        config,
      });
      return { text: response.text || '', model: GEMINI_MODEL_FALLBACK, fallbackUsed: true };
    } catch (fallbackError) {
      throw toGatewayError(fallbackError);
    }
  }
};
