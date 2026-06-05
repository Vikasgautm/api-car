import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { AppError } from '../utils/app-error.util';

let cachedClient: Cerebras | null = null;

export function getCerebrasClient(): Cerebras {
  if (!cachedClient) {
    if (!process.env.CEREBRAS_API_KEY) {
      throw AppError.serviceUnavailable(
        'CEREBRAS_API_KEY is not set.',
        'AI service is currently unavailable. Please contact the administrator.',
      );
    }
    cachedClient = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });
  }
  return cachedClient;
}

export const CHATBOT_MODEL = process.env.CEREBRAS_CHATBOT_MODEL || process.env.CEREBRAS_MODEL || 'llama-3.3-70b';
export const INTELLIGENCE_MODEL = process.env.CEREBRAS_INTELLIGENCE_MODEL || 'gpt-oss-120b';
